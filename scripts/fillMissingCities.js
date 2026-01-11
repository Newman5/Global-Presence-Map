// scripts/fillMissingCities.js
/**
 * Automated Missing City Handler
 * 
 * This script finds cities in members.json that are missing from cities.json,
 * fetches their coordinates from OpenStreetMap Nominatim API, and automatically
 * adds them to cities.json with proper formatting.
 * 
 * Usage: npm run fill-cities
 * 
 * Features:
 * - Normalizes city names consistently (lowercase, spaces preserved)
 * - Prefers member-provided coordinates if available
 * - Verifies member coordinates against API (flags if >200km difference)
 * - Auto-detects country codes from Nominatim response
 * - Creates backup before modifying cities.json
 * - Rate-limits API requests to respect OSM usage policy (1.2s between requests)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// File paths
const membersPath = path.join(projectRoot, 'src', 'data', 'members.json')
const citiesPath = path.join(projectRoot, 'src', 'data', 'cities.json')

// Known corrections for common variants/typos
const CORRECTIONS = new Map([
    ['sanfrancisco', 'san francisco'],
    ['newyork', 'new york'],
    ['talin', 'tallinn'],
    ['"prince of wales island"', 'prince of wales island'],
    ["'prince of wales island'", 'prince of wales island'],
])

// CLI flags
const FORCE_API = process.argv.includes('--force-api')
const VERIFY_MEMBER = process.argv.includes('--verify-member') || true

/**
 * Normalizes a city name for consistent storage and lookup
 * Converts to lowercase, preserves spaces, applies known corrections
 */
function normalizeCity(raw) {
    if (typeof raw !== 'string') return undefined
    let s = raw.trim().toLowerCase()
    
    // Strip wrapping quotes if present
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
        s = s.slice(1, -1)
    }
    
    // Collapse internal whitespace
    s = s.replace(/\s+/g, ' ')
    
    // Apply known corrections
    return CORRECTIONS.get(s) ?? (s || undefined)
}

/**
 * Converts normalized city name to display name with proper capitalization
 * Example: "new york" -> "New York"
 */
function toDisplayName(normalized) {
    return normalized
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

/**
 * Fetches coordinates and country code from OpenStreetMap Nominatim API
 * @param {string} city - City name to geocode
 * @returns {Promise<{lat: number, lng: number, countryCode: string} | null>}
 */
async function getCoords(city) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&addressdetails=1`
    const res = await fetch(url, {
        headers: { 'User-Agent': 'GlobalPresenceMap/1.0 (fillMissingCities)' },
    })
    
    if (!res.ok) {
        console.warn(`HTTP ${res.status} for ${city}`)
        return null
    }
    
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null
    
    const first = data[0]
    if (!first || typeof first !== 'object' || !('lat' in first) || !('lon' in first)) return null
    
    const lat = Number.parseFloat(String(first.lat))
    const lng = Number.parseFloat(String(first.lon))
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    
    // Extract country code from address details
    const countryCode = first.address?.country_code?.toUpperCase() || 'XX'
    
    return {
        lat: Number(lat.toFixed(4)),
        lng: Number(lng.toFixed(4)),
        countryCode
    }
}

/**
 * Calculates Haversine distance between two coordinates in kilometers
 */
function distanceKm(a, b) {
    const R = 6371
    const dLat = (b.lat - a.lat) * Math.PI / 180
    const dLng = (b.lng - a.lng) * Math.PI / 180
    const s1 = Math.sin(dLat / 2), s2 = Math.sin(dLng / 2)
    const aa = s1 * s1 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * s2 * s2
    return 2 * R * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa))
}

/**
 * Main script execution
 */
async function main() {
    // ===== Validation: Check that required files exist =====
    if (!fs.existsSync(membersPath)) {
        console.error(`❌ members.json not found at ${membersPath}`)
        process.exit(1)
    }
    if (!fs.existsSync(citiesPath)) {
        console.error(`❌ cities.json not found at ${citiesPath}`)
        process.exit(1)
    }

    // ===== Load Data: Read and parse existing data files =====
    const members = JSON.parse(fs.readFileSync(membersPath, 'utf8'))
    const existingCities = JSON.parse(fs.readFileSync(citiesPath, 'utf8'))
    const existingKeys = new Set(Object.keys(existingCities).map(k => k.toLowerCase()))

    // ===== Extract Member Coordinates: Build map of city -> coordinates from members.json =====
    const memberCoords = new Map()
    for (let idx = 0; idx < members.length; idx++) {
        const m = members[idx]
        const n = normalizeCity(m.city)
        if (!n) continue
        
        const lat = Number(m.lat)
        const lng = Number(m.lng)
        if (Number.isFinite(lat) && Number.isFinite(lng) && !memberCoords.has(n)) {
            memberCoords.set(n, { lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)), idx })
        }
    }

    // ===== Find Missing Cities: Get unique cities from members that aren't in cities.json =====
    const normalizedCities = [...new Set(members.map(m => normalizeCity(m.city)).filter(Boolean))]
    const missing = normalizedCities.filter(c => !existingKeys.has(c))

    if (!missing.length) {
        console.log('✅ All cities already have coordinates.')
        return
    }

    console.log(`🌍 Found ${missing.length} missing cities:`)
    console.log(missing.join(', '))
    console.log('\n🔍 Resolving coordinates (prefer members.json, else Nominatim API)...\n')

    // ===== Resolve Coordinates: Fetch or use member-provided coordinates =====
    const resolved = []
    for (const city of missing) {
        const fromMember = memberCoords.get(city)

        // Try to use member-provided coordinates first
        if (fromMember && !FORCE_API) {
            let chosen = { lat: fromMember.lat, lng: fromMember.lng, countryCode: 'XX' }
            let note = `from members.json#${fromMember.idx}`

            // Verify member coordinates against API if requested
            if (VERIFY_MEMBER) {
                const api = await getCoords(city)
                if (api) {
                    const d = distanceKm(fromMember, api)
                    if (d > 200) {
                        // Override obviously-wrong member coords
                        chosen = api
                        note = `overrode member coords (Δ≈${d.toFixed(0)}km) with API`
                    } else {
                        // Use API's country code even if coordinates match
                        chosen.countryCode = api.countryCode
                    }
                    await new Promise(r => setTimeout(r, 1200))
                }
            }

            resolved.push({ city, ...chosen })
            console.log(`✅ ${city}: ${note} lat=${chosen.lat}, lng=${chosen.lng}, country=${chosen.countryCode}`)
            continue
        }

        // Fetch from API if no member coordinates available
        const api = await getCoords(city)
        if (api) {
            resolved.push({ city, ...api })
            console.log(`✅ ${city}: fetched lat=${api.lat}, lng=${api.lng}, country=${api.countryCode}`)
        } else {
            console.warn(`⚠️  No coordinates found for '${city}'`)
        }
        await new Promise(r => setTimeout(r, 1200))
    }

    if (!resolved.length) {
        console.log('\nNo new coordinates to add.')
        return
    }

    // ===== Update cities.json: Add new cities with proper formatting =====
    const newCities = {}
    for (const { city, lat, lng, countryCode } of resolved) {
        newCities[city] = {
            normalizedName: city,
            displayName: toDisplayName(city),
            lat,
            lng,
            countryCode
        }
    }

    // Merge with existing cities and sort alphabetically
    const updatedCities = { ...existingCities, ...newCities }
    const sortedCities = Object.keys(updatedCities)
        .sort()
        .reduce((acc, key) => {
            acc[key] = updatedCities[key]
            return acc
        }, {})

    // ===== Backup and Write: Create backup and save updated cities.json =====
    const backupPath = `${citiesPath}.bak.${Date.now()}`
    fs.copyFileSync(citiesPath, backupPath)
    fs.writeFileSync(citiesPath, JSON.stringify(sortedCities, null, 2) + '\n', 'utf8')

    console.log(`\n📝 Added ${resolved.length} ${resolved.length === 1 ? 'city' : 'cities'} to ${citiesPath}`)
    console.log(`🗄️  Backup created at ${backupPath}`)
}

main().catch(err => {
    console.error('💥 Error:', err)
    process.exit(1)
})
