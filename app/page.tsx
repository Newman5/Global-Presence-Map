'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import dynamic from "next/dynamic";

// Lazy load the globe library to avoid SSR issues
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

type Member = {
  name: string;
  city: string;
  lat: number | null;
  lng: number | null;
};

export default function Home() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globeRef = useRef<any>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Load members.json from the public directory
        fetch('/data/members.json')
            .then(res => res.json())
            .then((data: Member[]) => {
                setMembers(data);
                setLoading(false);
            })
            .catch((err: unknown) => {
                console.error('Error loading members:', err);
                setError('Failed to load members data');
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (globeRef.current) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            const controls = globeRef.current.controls();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            controls.autoRotate = true;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            controls.autoRotateSpeed = 0.5;
        }
    }, [loading]);

    // --- Points ---
    const points = useMemo(() => {
        return members
            .filter(m => m.lat !== null && m.lng !== null)
            .map((m) => ({
                lat: m.lat!,
                lng: m.lng!,
                size: 0.5,
                color: 'orange',
                label: `${m.name} (${m.city})`,
            }));
    }, [members]);

    // --- Arcs ---
    const arcs = useMemo(() => {
        if (points.length < 2) return [];
        const links: Array<{
            startLat: number;
            startLng: number;
            endLat: number;
            endLng: number;
            color: string[];
        }> = [];
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const pointI = points[i];
                const pointJ = points[j];
                if (!pointI || !pointJ) continue;
                links.push({
                    startLat: pointI.lat,
                    startLng: pointI.lng,
                    endLat: pointJ.lat,
                    endLng: pointJ.lng,
                    color: ['#ffaa00', '#ff6600']
                });
            }
        }
        return links;
    }, [points]);

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
                <div className="text-xl">Loading globe...</div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
                <div className="text-xl text-red-400">{error}</div>
            </main>
        );
    }

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-4">
            <h1 className="text-3xl font-bold mb-4">🌍 Global Presence Map</h1>
            <p className="text-gray-400 mb-6">{points.length} members from around the world</p>
            
            <div className="w-full max-w-5xl aspect-video sm:aspect-[16/9] rounded-lg overflow-hidden shadow-lg">
                <Globe
                    ref={globeRef}
                    globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                    backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                    pointsData={points}
                    pointAltitude="size"
                    pointColor="color"
                    pointLabel="label"
                    arcsData={arcs}
                    arcColor={'color'}
                    arcAltitude={0.2}
                    arcDashLength={0.5}
                    arcDashGap={0.02}
                    arcDashAnimateTime={3000}
                />
            </div>
        </main>
    );
}

