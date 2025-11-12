'use client';
import { useEffect, useRef, useMemo } from 'react';
import dynamic from "next/dynamic";
import { geocodeCity } from '~/lib/geocode';

// Lazy load the globe library to avoid SSR issues
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

// Temporary mock coordinates for demo purposes
const cityCoords: Record<string, { lat: number; lng: number }> = {
    Taipei: { lat: 25.033, lng: 121.565 },
    Bangalore: { lat: 12.9716, lng: 77.5946 },
    'New York': { lat: 40.7128, lng: -74.006 },
    London: { lat: 51.5072, lng: -0.1276 },
    Tokyo: { lat: 35.6762, lng: 139.6503 },
};


export default function MeetingGlobe({ participants }: { participants: any[] }) {
    const globeRef = useRef<any>(null);

    useEffect(() => {
        if (globeRef.current) {
            globeRef.current.controls().autoRotate = true;
            globeRef.current.controls().autoRotateSpeed = 0.5;
        }
    }, []);

    // --- Points ---
    const points = useMemo(() => {
        return participants
            .map((p) => {
                const coords = geocodeCity(p.city);
                if (!coords) return null;
                return {
                    lat: coords.lat,
                    lng: coords.lng,
                    size: 0.5,
                    color: 'orange',
                    label: `${p.name} (${p.city})`,
                };
            })
            .filter((p): p is NonNullable<typeof p> => p !== null);
    }, [participants]);

    // --- Arcs ---
    const arcs = useMemo(() => {
        if (points.length < 2) return [];
        const links: any[] = [];
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

    return (
        <div className="w-full h-full">
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
    );
}
