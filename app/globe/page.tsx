'use client';

import { geocodeCity } from "~/lib/geocode";
import MeetingGlobe from "../../src/components/MeetingGlobe";
import { useState } from 'react';

interface Participant {
    name: string;
    city: string;
}

/**
 * Globe Page - Main UI for creating and visualizing meeting maps
 * 
 * Workflow:
 * 1. User enters meeting name and participant list (format: "Name, City")
 * 2. Click "Render Globe" to create meeting and visualize
 * 3. Click "Export Globe" to save as standalone HTML file
 * 4. Click "Clear" to reset and create another meeting
 */
export default function GlobePage() {
    const [unknownCities, setUnknownCities] = useState<string[]>([]);
    const [inputText, setInputText] = useState('');
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(false);
    const [meetingName, setMeetingName] = useState('');
    const [lastExportUrl, setLastExportUrl] = useState<string | null>(null);

    /**
     * Creates a new meeting with participants via API
     * Validates cities and displays the globe visualization
     */
    async function handleRender() {
        setLoading(true);
        
        const parsed = parseParticipantInput(inputText);
        const missing = parsed.filter(p => !geocodeCity(p.city)).map(p => p.city);
        setUnknownCities(missing);

        try {
            const response = await fetch('/api/meetings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: meetingName || 'Untitled Meeting',
                    participants: parsed,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to create meeting: ${response.status}`);
            }

            const data = await response.json() as { meeting: { id: string }; warnings?: string[] };
            
            if (data.warnings?.length) {
                console.warn('Meeting creation warnings:', data.warnings);
            }

            setParticipants(parsed);
        } catch (err) {
            console.error('Error creating meeting:', err);
            alert('Failed to create meeting. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    /**
     * Exports current globe as standalone HTML file
     * Tries to save to server first, falls back to browser download
     */
    async function handleExport() {
        if (participants.length === 0) {
            alert('Nothing to export!');
            return;
        }

        const { title, filename, exportPath } = buildExportMetadata(meetingName);
        const html = buildGlobeHTML(participants, title);

        try {
            await saveToServer(html, filename);
            setLastExportUrl(exportPath);
            alert(`✅ Saved to server: ${exportPath}`);
        } catch (err) {
            console.warn('Save to server failed, using browser download:', err);
            downloadInBrowser(html, filename);
            setLastExportUrl(exportPath);
            alert(`💾 Downloaded ${filename}`);
        }
    }

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-4">
            <h1 className="text-3xl font-bold mb-4">🌍 Global Presence Map</h1>
            
            <input
                type="text"
                value={meetingName}
                onChange={(e) => setMeetingName(e.target.value)}
                placeholder="Optional meeting name"
                className="w-full max-w-xl p-2 rounded bg-gray-800 text-white placeholder-gray-500"
            />
            
            <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your members here: e.g. Lewis, Taipei"
                className="w-full max-w-xl h-48 p-3 rounded bg-gray-800 text-white mb-4"
            />
            
            <div className="flex gap-4">
                <button
                    onClick={handleRender}
                    disabled={loading}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded disabled:opacity-50"
                >
                    {loading ? 'Submitting...' : 'Render Globe'}
                </button>
                <button
                    onClick={() => {
                        setInputText('');
                        setParticipants([]);
                        setUnknownCities([]);
                        setMeetingName('');
                    }}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded"
                >
                    Clear
                </button>
                <button
                    onClick={handleExport}
                    disabled={participants.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded disabled:opacity-50"
                >
                    Export Globe
                </button>
            </div>

            {lastExportUrl && (
                <div className="mt-6">
                    <a
                        href={lastExportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 underline"
                    >
                        🌍 View Last Exported Globe
                    </a>
                </div>
            )}

            {participants.length > 0 && (
                <div className="flex w-full justify-center mt-6">
                    <div className="w-full max-w-5xl aspect-video sm:aspect-[16/9] rounded-lg overflow-hidden shadow-lg">
                        <MeetingGlobe participants={participants} />
                    </div>
                </div>
            )}
            
            {unknownCities.length > 0 && (
                <p className="text-red-400 mt-2">
                    Unknown cities: {unknownCities.join(', ')}
                </p>
            )}
        </main>
    );
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parses participant input text into structured format
 * Expected format: "Name, City" on each line
 */
function parseParticipantInput(inputText: string): Participant[] {
    return inputText
        .trim()
        .split('\n')
        .map(line => {
            const [name, city] = line.split(',').map(s => s.trim());
            if (!name || !city) return null;
            return { name, city };
        })
        .filter((p): p is Participant => p !== null);
}

/**
 * Builds export metadata (title, filename, path)
 */
function buildExportMetadata(meetingName: string) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]!;
    const title = meetingName || 'Untitled Meeting';
    const safeName = title.replace(/\s+/g, '-');
    const filename = `${safeName}-${dateStr}.html`;
    const exportPath = `https://newman5.github.io/Global-Presence-Map/exports/${filename}`;
    
    return { title, filename, exportPath, dateStr };
}

/**
 * Builds standalone HTML file with embedded globe visualization
 * Resolves coordinates at export time for self-contained file
 */
function buildGlobeHTML(participants: Participant[], title: string): string {
    const { dateStr } = buildExportMetadata(title);
    const points = buildGlobePoints(participants);
    
    if (points.length === 0) {
        throw new Error('No valid cities to export');
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html, body {
      margin: 0;
      height: 100%;
      background: black;
      display: flex;
      flex-direction: column;
    }
    .container {
      position: relative;
      display: flex;
      flex: 1 1 auto;
      align-items: stretch;
      justify-content: center;
      min-height: 0;
    }
    #globe {
      width: 100%;
      height: 100%;
      max-height: 100dvh;
      min-height: 40vh;
      overflow: hidden;
      flex: 1 1 auto;
      position: relative;
    }
    .overlay {
      position: absolute;
      top: 12px;
      left: 12px;
      color: white;
      font-family: sans-serif;
      font-weight: bold;
      background: rgba(0,0,0,0.35);
      padding: 6px 8px;
      border-radius: 6px;
      z-index: 2;
      font-size: clamp(12px, 2.5vw, 16px);
      pointer-events: none;
    }
    @media (max-width: 420px) {
      .overlay { left: 8px; top: 8px; padding: 4px 6px; }
      #globe { min-height: 50vh; }
    }
  </style>
  <script src="https://unpkg.com/globe.gl"></script>
</head>
<body>
  <section class="container">
    <div id="globe"></div>
    <div class="overlay">${title} — ${dateStr}</div>
  </section>
  <script>
    const points = ${JSON.stringify(points)};
    const arcs = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        arcs.push({
          startLat: points[i].lat,
          startLng: points[i].lng,
          endLat: points[j].lat,
          endLng: points[j].lng,
          color: ['#ffaa00', '#ff6600']
        });
      }
    }
    const globe = Globe()
      .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
      .pointsData(points).pointColor('color').pointLabel('label')
      .arcsData(arcs).arcColor('color').arcAltitude(0.2).arcDashLength(0.5).arcDashGap(0.02).arcDashAnimateTime(3000);
    globe(document.getElementById('globe'));
  </script>
</body>
</html>`;
}

/**
 * Converts participants to globe point data with coordinates
 * Filters out participants with unknown cities
 */
function buildGlobePoints(participants: Participant[]) {
    return participants
        .map(p => {
            const coords = geocodeCity(p.city);
            if (!coords || isNaN(coords.lat) || isNaN(coords.lng)) {
                return null;
            }
            return {
                lat: coords.lat,
                lng: coords.lng,
                label: `${p.name} (${p.city})`,
                color: 'green'
            };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);
}

/**
 * Saves HTML file to server via API
 */
async function saveToServer(html: string, filename: string): Promise<void> {
    const response = await fetch('/api/save-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, filename }),
    });

    if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
    }
}

/**
 * Downloads HTML file in browser as fallback
 */
function downloadInBrowser(html: string, filename: string): void {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
