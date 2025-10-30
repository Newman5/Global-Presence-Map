'use client';

import MeetingGlobe from "../../src/components/MeetingGlobe";
import { useState } from 'react';

export default function GlobePage() {
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

        setParticipants(parsed);
    }
    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-4">
            <h1 className="text-3xl font-bold mb-4">🌍 Meeting Atlas</h1>
            <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your members here: e.g. Lewis, Taipei"
                className="w-full max-w-xl h-48 p-3 rounded bg-gray-800 text-white mb-4"
            />
            <button
                onClick={handleRender}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded mb-6"
            >
                Render Globe
            </button>

            {participants.length > 0 && (
                <div className="w-full max-w-4xl">
                    <MeetingGlobe participants={participants} />
                </div>
            )}
        </main>
    );
}
