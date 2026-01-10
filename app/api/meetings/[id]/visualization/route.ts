import { NextResponse } from "next/server";
import { loadMeeting } from "~/lib/meetings";
import { getMembersByIds } from "~/lib/members";
import { getCityCoordinates } from "~/lib/cities";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/meetings/[id]/visualization
 * Returns computed visualization data for a meeting
 * 
 * Phase 2 Implementation:
 * - Computes visualization data at runtime
 * - No stored coordinates in response
 * - Clear separation between stored and computed data
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Load meeting
    const meeting = loadMeeting(id);
    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Load members
    const members = getMembersByIds(meeting.participantIds);

    // Compute points with coordinates
    const points = members
      .map(member => {
        // Get coordinates from cities service (runtime computation)
        const coords = getCityCoordinates(member.city);
        
        if (!coords) {
          console.warn(`No coordinates found for city: ${member.city}`);
          return null;
        }

        return {
          memberId: member.id,
          memberName: member.name,
          cityName: member.city,
          lat: coords.lat,
          lng: coords.lng,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    // Compute arcs (all-to-all connections)
    const arcs = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const pointI = points[i];
        const pointJ = points[j];
        if (!pointI || !pointJ) continue;
        
        arcs.push({
          startLat: pointI.lat,
          startLng: pointI.lng,
          endLat: pointJ.lat,
          endLng: pointJ.lng,
        });
      }
    }

    return NextResponse.json({
      meeting: {
        id: meeting.id,
        title: meeting.title,
        date: meeting.date,
      },
      points,
      arcs,
    });
  } catch (error) {
    console.error('Error getting visualization:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
