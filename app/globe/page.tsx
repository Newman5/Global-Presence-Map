'use client';

import { geocodeCity } from "~/lib/geocode";
import MeetingGlobe from "../../src/components/MeetingGlobe";
import { useState } from 'react';

export default function GlobePage() {
    const [unknownCities, setUnknownCities] = useState<string[]>([]);

    const [inputText, setInputText] = useState('');
    const [participants, setParticipants] = useState<any[]>([]);

    function handleRender() {
        const lines = inputText.trim().split('\n');
        const parsed = lines
            .map(line => {
                const [name, city] = line.split(',').map(s => s.trim());
                if (!name || !city) return null;
                return { name, city };
            })
            .filter(Boolean);

        const missing = parsed
            .filter(p => !geocodeCity(p.city))
            .map(p => p.city);

        setUnknownCities(missing);
        setParticipants(parsed);
    }
    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-4">
            <h1 className="text-3xl font-bold mb-4">🌍 Global Presence Map</h1>
            <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your members here: e.g. Lewis, Taipei"
                className="w-full max-w-xl h-48 p-3 rounded bg-gray-800 text-white mb-4"
            />
            <div className="flex gap-4">
            <button
                onClick={handleRender}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded"
            >
                Render Globe
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
            </div>

            {participants.length > 0 && (
                //width half the container and centered
                <div className="flex w-full justify-center">
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
