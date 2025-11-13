// scripts/fillMissingCoords.js
// Usage: node scripts/fillMissingCoords.js
// Finds cities in members.json that are missing from cityCoords.ts,
// normalizes names, prefers member-provided lat/lng, otherwise fetches from
// OpenStreetMap Nominatim, and auto-inserts them into cityCoords.ts.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Use global fetch (Node 18+)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const membersPath = path.join(projectRoot, 'src', 'data', 'members.json')
const coordsPath = path.join(projectRoot, 'src', 'data', 'cityCoords.ts')

// Known corrections for common variants/typos
const CORRECTIONS = new Map([
    ['sanfrancisco', 'san francisco'],
    ['newyork', 'new york'],
    ['talin', 'tallinn'],
    ['"prince of wales island"', 'prince of wales island'],
    ["'prince of wales island'", 'prince of wales island'],
])

function normalizeCity(raw) {
    if (typeof raw !== 'string') return undefined
    let s = raw.trim().toLowerCase()
    // strip wrapping quotes if present
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
        s = s.slice(1, -1)
    }
    // collapse internal whitespace
    s = s.replace(/\s+/g, ' ')
    // Use parentheses when mixing ?? and ||
    return (CORRECTIONS.get(s) ?? (s || undefined))
}

/**
 * @typedef {{ lat: string, lon: string }} NominatimResult
 * @param {string} city
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
async function getCoords(city) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`
    const res = await fetch(url, {
        headers: { 'User-Agent': 'GlobalPresenceMap/1.0 (fillMissingCoords)' },
    })
    if (!res.ok) {
        console.warn(`HTTP ${res.status} for ${city}`)
        return null
    }
    /** @type {unknown} */
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null
    const first = data[0]
    if (!first || typeof first !== 'object' || !('lat' in first) || !('lon' in first)) return null
    const lat = Number.parseFloat(String(first.lat))
    const lng = Number.parseFloat(String(first.lon))
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)) }
}

/**
 * Find the top-level object literal of cityCoords and return its [start,end] indices and parsed object.
 */
function findObjectRangeAndParse(tsText) {
    const eq = tsText.indexOf('=')
    if (eq === -1) return null
    let i = tsText.indexOf('{', eq)
    if (i === -1) return null

    let depth = 0
    let inStr = false
    let strCh = ''
    let esc = false
    let end = -1
    for (let j = i; j < tsText.length; j++) {
        const ch = tsText[j]
        if (inStr) {
            if (esc) {
                esc = false
            } else if (ch === '\\') {
                esc = true
            } else if (ch === strCh) {
                inStr = false
            }
            continue
        }
        if (ch === '"' || ch === "'") {
            inStr = true
            strCh = ch
            continue
        }
        if (ch === '{') depth++
        if (ch === '}') {
            depth--
            if (depth === 0) {
                end = j
                break
            }
        }
    }
    if (end === -1) return null

    const objectLiteral = tsText.slice(i, end + 1)
    let obj
    try {
        // eslint-disable-next-line no-new-func
        obj = Function(`"use strict"; return (${objectLiteral});`)()
    } catch (e) {
        console.warn('Could not evaluate cityCoords object; falling back to empty object.', e)
        obj = {}
    }
    return { start: i, end, object: obj }
}

/**
 * Try to detect indentation used inside the object literal.
 */
function detectIndent(tsText, start, end) {
    const lines = tsText.slice(start, end + 1).split('\n')
    for (const line of lines) {
        const m = line.match(/^(\s+)[^{}\s]/)
        if (m) return m[1]
    }
    return '  '
}

async function main() {
    if (!fs.existsSync(membersPath)) {
        console.error(`❌ members.json not found at ${membersPath}`)
        process.exit(1)
    }
    if (!fs.existsSync(coordsPath)) {
        console.error(`❌ cityCoords.ts not found at ${coordsPath}`)
        process.exit(1)
    }

    /** @type {Array<{name: string, city?: string, lat?: number|null, lng?: number|null}>} */
    const members = JSON.parse(fs.readFileSync(membersPath, 'utf8'))
    const tsText = fs.readFileSync(coordsPath, 'utf8')
    const parsed = findObjectRangeAndParse(tsText)
    if (!parsed) {
        console.error('❌ Could not locate object literal in cityCoords.ts')
        process.exit(1)
    }
    const { start, end, object: existingObj } = parsed
    const existingKeys = new Set(Object.keys(existingObj).map(k => k.toLowerCase()))
    const indent = detectIndent(tsText, start, end)

    // Build map of normalizedCity -> first valid {lat,lng} from members.json
    /** @type {Map<string, {lat:number, lng:number}>} */
    const memberCoords = new Map()
    for (const m of members) {
        const n = normalizeCity(m.city)
        if (!n) continue
        const lat = Number(m.lat)
        const lng = Number(m.lng)
        if (Number.isFinite(lat) && Number.isFinite(lng) && !memberCoords.has(n)) {
            memberCoords.set(n, { lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)) })
        }
    }

    // Unique normalized cities from members.json
    const normalizedCities = [...new Set(members.map(m => normalizeCity(m.city)).filter(Boolean))]

    // Missing relative to existing keys
    const missing = normalizedCities.filter(c => !existingKeys.has(c))

    if (!missing.length) {
        console.log('✅ All cities already have coordinates.')
        return
    }

    console.log(`🌍 Found ${missing.length} missing cities:`)
    console.log(missing.join(', '))
    console.log('\nResolving coordinates (prefer members.json, else Nominatim)...\n')

    /** @type {Array<{city:string, lat:number, lng:number}>} */
    const resolved = []
    for (const city of missing) {
        const fromMember = memberCoords.get(city)
        if (fromMember) {
            resolved.push({ city, ...fromMember })
            console.log(`✅ ${city}: from members.json lat=${fromMember.lat}, lng=${fromMember.lng}`)
            continue
        }
        const coords = await getCoords(city)
        if (coords) {
          resolved.push({ city, ...coords })
          console.log(`✅ ${city}: fetched lat=${coords.lat}, lng=${coords.lng}`)
      } else {
          console.warn(`⚠️  No coordinates found for '${city}'`)
      }
        // Be polite to Nominatim
        await new Promise(r => setTimeout(r, 1200))
    }

    const additions = resolved
        .sort((a, b) => a.city.localeCompare(b.city))
        .map(({ city, lat, lng }) => `${indent}'${city}': { lat: ${lat}, lng: ${lng} },`)

    if (!additions.length) {
        console.log('\nNo new coordinates to add.')
        return
    }

    // Insert before closing brace of the object literal
    const before = tsText.slice(0, end)
    const after = tsText.slice(end) // includes closing }

    // Ensure newline before our additions
    const needsNewline = before.length && before[before.length - 1] !== '\n'
    const insert = (needsNewline ? '\n' : '') + additions.join('\n') + '\n'

    // Backup and write
    const backupPath = `${coordsPath}.bak.${Date.now()}`
    fs.copyFileSync(coordsPath, backupPath)
    fs.writeFileSync(coordsPath, before + insert + after, 'utf8')

    console.log(`\n📝 Inserted ${additions.length} entr${additions.length === 1 ? 'y' : 'ies'} into ${coordsPath}`)
    console.log(`🗄️  Backup created at ${backupPath}`)
}

main().catch(err => {
    console.error('💥 Error:', err)
    process.exit(1)
})
