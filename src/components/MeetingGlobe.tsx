'use client';
import { useEffect, useRef } from 'react';
import dynamic from "next/dynamic";
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

    const points = participants
        .map((p) => {
            const coords = cityCoords[p.city];
            if (!coords) return null;
            return {
                lat: coords.lat,
                lng: coords.lng,
                size: 0.4,
                color: 'orange',
                label: `${p.name} (${p.city})`,
            };
        })
        .filter(Boolean);

    return (
        <div className="w-full h-[600px]">
            <Globe
                ref={globeRef}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                pointsData={points}
                pointAltitude="size"
                pointColor="color"
                pointLabel="label"
            />
        </div>
    );
}
