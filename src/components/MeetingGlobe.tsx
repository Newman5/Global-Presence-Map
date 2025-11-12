'use client';
import { useEffect, useRef, useMemo } from 'react';
import dynamic from "next/dynamic";
import { geocodeCity } from '~/lib/geocode';

// Lazy load the globe library to avoid SSR issues
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

interface Participant {
    name: string;
    city?: string;
}

interface PointData {
    lat: number;
    lng: number;
    size: number;
    color: string;
    label: string;
}

interface ArcData {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    color: string[];
}

export default function MeetingGlobe({ participants }: { participants: Participant[] }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globeRef = useRef<any>(null);

    useEffect(() => {
        if (globeRef.current) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            globeRef.current.controls().autoRotate = true;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            globeRef.current.controls().autoRotateSpeed = 0.5;
        }
    }, []);

    // --- Points ---
    const points = useMemo(() => {
        return participants
            .map((p): PointData | null => {
                const coords = geocodeCity(p.city);
                if (!coords) return null;
                return {
                    lat: coords.lat,
                    lng: coords.lng,
                    size: 0.5,
                    color: 'orange',
                    label: `${p.name} (${p.city ?? 'Unknown'})`,
                };
            })
            .filter((p): p is PointData => p !== null);
    }, [participants]);

    // --- Arcs ---
    const arcs = useMemo((): ArcData[] => {
        if (points.length < 2) return [];
        const links: ArcData[] = [];
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
