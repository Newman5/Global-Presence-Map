'use client';

import { geocodeCity } from "~/lib/geocode";
import MeetingGlobe from "../../src/components/MeetingGlobe";
import { useState } from 'react';

interface Participant {
    name: string;
    city: string;
}

export default function GlobePage() {
    const [unknownCities, setUnknownCities] = useState<string[]>([]);
    const [inputText, setInputText] = useState('');
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(false);
    const [meetingName, setMeetingName] = useState('');
    const [lastExportUrl, setLastExportUrl] = useState<string | null>(null);

    async function handleRender() {
        setLoading(true);
        const lines = inputText.trim().split('\n');
        const parsed = lines
            .map(line => {
                const [initial, city] = line.split(',').map(s => s.trim());
                if (!initial || !city) return null;
                return { name: initial, city };
            })
            .filter(Boolean) as { name: string; city: string }[];

        const missing = parsed
            .filter(p => !geocodeCity(p.city))
            .map(p => p.city);

        setUnknownCities(missing);

        // Phase 2: Single API call to create meeting with all participants
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
            
            if (data.warnings && data.warnings.length > 0) {
                console.warn('Meeting creation warnings:', data.warnings);
            }

            setParticipants(parsed);
        } catch (err) {
            console.error('Error creating meeting:', err);
            alert('Failed to create meeting. Please try again.');
        }

        setLoading(false);
    }

    // --- Export HTML directly in browser ---
    async function handleExport() {
        if (participants.length === 0) return alert('Nothing to export!');

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const title = meetingName || 'Untitled Meeting';
        const safeName = title.replace(/\s+/g, '-');

        // Build points with resolved coords NOW (so the exported file is self-contained)
        const points = participants
            .map(p => {
                const c = geocodeCity(p.city);
                if (!c) return null;
                if (isNaN(c.lat) || isNaN(c.lng)) return null; // skip unknowns
                return {
                    lat: c.lat,
                    lng: c.lng,
                    label: `${p.name} (${p.city})`,
                    color: 'green'
                };
            })
            .filter((p): p is { lat: number; lng: number; label: string; color: string } => Boolean(p));

        if (points.length === 0) {
            alert('No valid cities to export. Please fix unknown cities.');
            return;
        }
        // (Removed unreachable condition: already checked above)


        // Build arcs (all-to-all for now)
        const arcs = [];
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                arcs.push({
                    startLat: points[i]!.lat,
                    startLng: points[i]!.lng,
                    endLat: points[j]!.lat,
                    endLng: points[j]!.lng,
                    color: ['#ffaa00', '#ff6600']
                });
            }
        }

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
    /* layout */
    html, body {
      margin: 0;
      height: 100%;
      background: black;
      display: flex;
      flex-direction: column;
    }
    /* container centers globe and allows footer/other content later */
    .container {
      position: relative;
      display: flex;
      flex: 1 1 auto;
      align-items: stretch;
      justify-content: center;
      min-height: 0; /* allow children to size correctly inside flex */
    }
    /* globe takes full width and adapts height on mobile.
       max-height uses device viewport height (100dvh) to avoid address-bar issues on mobile */
    #globe {
      width: 100%;
      height: 100%;
      max-height: 100dvh;
      min-height: 40vh;
      overflow: hidden;
      flex: 1 1 auto;
      position: relative;
    }
    /* overlay positioned inside container; responsive font-size */
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
    /* smaller tweaks for very small screens */
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
    for (let i=0;i<points.length;i++) {
      for (let j=i+1;j<points.length;j++) {
        arcs.push({ startLat: points[i].lat, startLng: points[i].lng, endLat: points[j].lat, endLng: points[j].lng, color: ['#ffaa00','#ff6600'] });
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


        //build a file in the public/exports folder via post to api/save-meeting

        const filename = `${safeName}-${dateStr}.html`;
        const exportPath = `https://newman5.github.io/Global-Presence-Map/exports/${filename}`; // where the file will be if saved on server
        try {
            const res = await fetch('/api/save-meeting', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ html, filename }),
            });

            if (res.ok) {
                setLastExportUrl(exportPath);
                alert(`✅ Saved to server: ${exportPath}`);
                return;
            }
            throw new Error(`Server responded ${res.status}`);
        } catch (err) {
            console.warn('⚠️ Save to server failed, falling back to download:', err);

            // 🪄 Fallback for static GitHub Pages mode
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
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
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded"
                >
                    {loading ? 'Submitting...' : 'Render Globe'}
                </button>
                <button
                    onClick={() => {
                        setInputText('');
                        setParticipants([]);
                        setUnknownCities([]);
                    }}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded"
                >
                    Clear
                </button>
                <button
                    onClick={handleExport}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
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
