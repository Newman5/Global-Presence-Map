// scripts/fillMissingCoords.js
// Usage: node scripts/fillMissingCoords.js
// Finds cities in members.json that are missing from cityCoords.ts
// Uses OpenStreetMap Nominatim to fetch coordinates and prints formatted entries.

import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

const membersPath = path.join(process.cwd(), 'src', 'data', 'members.json')
const coordsPath = path.join(process.cwd(), 'src', 'data', 'cityCoords.ts')

async function getCoords(city) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        city
    )}&format=json&limit=1`
    const res = await fetch(url, {
        headers: { 'User-Agent': 'GlobalPresenceMap/1.0 (fillMissingCoords)' },
    })
    const data = await res.json()
    if (!data.length) return null
    const lat = parseFloat(data[0].lat).toFixed(4)
    const lng = parseFloat(data[0].lon).toFixed(4)
    return { lat, lng }
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

    const members = JSON.parse(fs.readFileSync(membersPath, 'utf8'))
    const existingText = fs.readFileSync(coordsPath, 'utf8').toLowerCase()

    // collect all unique cities
    const cities = [...new Set(members.map(m => m.city?.trim().toLowerCase()).filter(Boolean))]

    const missing = cities.filter(city => !existingText.includes(`${city}:`))
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
        // respect Nominatim rate limit (max 1 per sec)
        await new Promise(r => setTimeout(r, 1200))
    }

    if (additions.length) {
        console.log('\n📋 Copy the following lines into src/data/cityCoords.ts:\n')
        console.log(additions.join('\n'))
    } else {
        console.log('\nNo new coordinates to add.')
    }
}

main().catch(err => console.error('💥 Error:', err))
