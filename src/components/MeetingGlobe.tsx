'use client';

import dynamic from "next/dynamic";
import members from "../data/members.json";

// Lazy load the globe library to avoid SSR issues
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

export default function MeetingGlobe() {
    // Filter valid coordinates and map to points
    const points = members
        .filter((m) => m.lat && m.lng)
        .map((m) => ({
            lat: m.lat,
            lng: m.lng,
            label: `${m.name} — ${m.city}`,
        }));

    return (
        <div className="flex justify-center items-center h-[600px]">
            <Globe
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg"
                backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                pointsData={points}
                pointAltitude={0.22}
                pointColor={() => "orange"}
                pointLabel={(d: any) => d.label}
            />
        </div>
    );
}
