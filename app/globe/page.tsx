'use client';

import { geocodeCity } from "~/lib/geocode";
import MeetingGlobe from "../../src/components/MeetingGlobe";
import { useState } from 'react';

export default function GlobePage() {
    const [unknownCities, setUnknownCities] = useState<string[]>([]);
    const [inputText, setInputText] = useState('');
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [meetingName, setMeetingName] = useState('');

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
        setParticipants(parsed);

        // 📨 send each entry to /api/add-member
        for (const p of parsed) {
            console.log('Posting', p);
            try {
                await fetch('/api/add-member', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(p),
                });
            } catch (err) {
                console.error('Error posting', p, err);
            }
        }

        setLoading(false);
    }

    // --- Export HTML directly in browser ---
    function handleExport() {
        if (participants.length === 0) return alert('Nothing to export!');

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const title = meetingName || 'Untitled Meeting';
        const safeName = title.replace(/\s+/g, '-');

        // Build points with resolved coords NOW (so the exported file is self-contained)
        const points = participants
            .map(p => {
                const c = geocodeCity(p.city);
                if (!c) return null; // skip unknowns
                return {
                    lat: c.lat,
                    lng: c.lng,
                    label: `${p.name} (${p.city})`,
                    color: 'orange'
                };
            })
            .filter(Boolean) as Array<{ lat: number; lng: number; label: string; color: string }>;

        if (points.length === 0) {
            alert('No valid cities to export. Please fix unknown cities.');
            return;
        }

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
    html,body { margin:0; height:100%; background:black; }
    #globe { width:100vw; height:100vh; overflow:hidden; }
    .overlay { position:absolute; top:12px; left:12px; color:white; font-family:sans-serif; font-weight:bold; }
  </style>
  <script src="https://unpkg.com/three"></script>
  <script src="https://unpkg.com/globe.gl"></script>
</head>
<body>
  <div id="globe"></div>
  <div class="overlay">${title} — ${dateStr}</div>
  <script>
    const data = ${JSON.stringify(participants)};
    const points = data.map(p => ({ lat: p.lat, lng: p.lng, label: p.name + ' (' + p.city + ')', color: 'orange' }));
    const arcs = [];
    for (let i=0;i<points.length;i++) {
      for (let j=i+1;j<points.length;j++) {
        arcs.push({ startLat: points[i].lat, startLng: points[i].lng, endLat: points[j].lat, endLng: points[j].lng, color: ['#ffaa00','#ff6600'] });
      }
    }
    const globe = Globe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .pointsData(points).pointColor('color').pointLabel('label')
      .arcsData(arcs).arcColor('color').arcAltitude(0.2).arcDashLength(0.5).arcDashGap(0.02).arcDashAnimateTime(3000);
    globe(document.getElementById('globe'));
  </script>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${safeName}-${dateStr}.html`;
        link.click();
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
