'use client';

import MeetingGlobe from "../../src/components/MeetingGlobe";

export default function GlobePage() {
    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white">
            <h1 className="text-3xl font-bold mb-4">🌍 Global Meeting View</h1>
            <MeetingGlobe />
        </main>
    );
}
