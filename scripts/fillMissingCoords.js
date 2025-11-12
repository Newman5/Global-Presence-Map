// scripts/fillMissingCoords.js
// Usage: node scripts/fillMissingCoords.js
// Finds cities in members.json that are missing from cityCoords.ts
// Uses OpenStreetMap Nominatim to fetch coordinates and prints formatted entries.

import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

const membersPath = path.join(process.cwd(), 'src', 'data', 'members.json')
const coordsPath = path.join(process.cwd(), 'src', 'data', 'cityCoords.ts')

/**
 * Type guard to filter out undefined values
 * @param {string | undefined} value
 * @returns {value is string}
 */
function isValidCity(value) {
    return typeof value === 'string' && value.length > 0
}

/**
 * @typedef {{ lat: string, lon: string }} NominatimResult
 */

/**
 * @param {string} city
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
async function getCoords(city) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        city
    )}&format=json&limit=1`
    const res = await fetch(url, {
        headers: { 'User-Agent': 'GlobalPresenceMap/1.0 (fillMissingCoords)' },
    })
    if (!res.ok) {
        console.warn(`HTTP ${res.status} for ${city}`)
        return null
    }
    /** @type {unknown} */
    const data = await res.json()
    // data is expected to be NominatimResult[]
    if (!Array.isArray(data) || data.length === 0) return null
    const first = data[0]
    if (!first || typeof first !== 'object' || !('lat' in first) || !('lon' in first)) return null
    const lat = Number.parseFloat(String(first.lat))
    const lng = Number.parseFloat(String(first.lon))
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)) }
}

async function main() {
    if (!fs.existsSync(membersPath)) {
        console.error('❌ members.json not found.')
        process.exit(1)
    }
    if (!fs.existsSync(coordsPath)) {
        console.error('❌ cityCoords.ts not found.')
        process.exit(1)
    }

    /** @type {Array<{name: string, city?: string}>} */
    const members = JSON.parse(fs.readFileSync(membersPath, 'utf8'))
    const existingText = fs.readFileSync(coordsPath, 'utf8')

    // collect all unique cities
    const allCities = members.map((/** @type {{city?: string}} */ m) => m.city?.trim().toLowerCase())
    const filteredCities = allCities.filter(isValidCity)
    const cities = [...new Set(filteredCities)]

    // safer regex check for key presence: matches 'city': or "city" : (case-insensitive)
    const missing = cities.filter((city) => {
        const re = new RegExp(`['"]${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]\\s*:`, 'i')
        return !re.test(existingText)
    })

    if (!missing.length) {
        console.log('✅ All cities already have coordinates.')
        return
    }

    console.log(`🌍 Found ${missing.length} missing cities:`)
    console.log(missing.join(', '))
    console.log('\nFetching coordinates from OpenStreetMap...\n')

    const additions = []

    for (const city of missing) {
        const coords = await getCoords(city)
        if (coords) {
            const entry = `  '${city}': { lat: ${coords.lat}, lng: ${coords.lng} },`
            additions.push(entry)
            console.log(`✅ ${city}: lat=${coords.lat}, lng=${coords.lng}`)
        } else {
            console.warn(`⚠️  No coordinates found for '${city}'`)
        }
        await new Promise((r) => setTimeout(r, 1200))
    }

    if (additions.length) {
        console.log('\n📋 Copy the following lines into src/data/cityCoords.ts:\n')
        console.log(additions.join('\n'))
    } else {
        console.log('\nNo new coordinates to add.')
    }
}

main().catch(err => console.error('💥 Error:', err))
