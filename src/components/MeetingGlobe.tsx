'use client';
import { useRef, useEffect } from "react";
import Globe from "react-globe.gl";
import meetingData from "../data/sample-meeting.json";

export default function MeetingGlobe() {
    const globeRef = useRef<any>(null);

    useEffect(() => {
        if (!globeRef.current) return;
        globeRef.current.controls().autoRotate = true;
        globeRef.current.controls().autoRotateSpeed = 0.5;
    }, []);

    const points = meetingData.participants.map((p) => ({
        lat: p.lat,
        lng: p.lng,
        size: 0.4,
        color: "orange",
        label: `${p.name} (${p.city})`,
    }));

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
