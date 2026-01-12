import { NextResponse } from "next/server";
import { validateCreateMeetingInput } from "~/lib/validation";
import { findOrCreateMember } from "~/lib/members";
import { createMeeting } from "~/lib/meetings";

/**
 * POST /api/meetings
 * Creates a new meeting with participants
 * 
 * This is the main API endpoint for creating meetings. It handles the complete workflow:
 * 1. Validates input (title, participants array)
 * 2. Finds or creates members (automatic deduplication)
 * 3. Creates meeting with participant IDs
 * 4. Persists everything to disk
 * 
 * Request Body:
 * {
 *   title: string,
 *   participants: Array<{ name: string, city: string }>
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   meeting: Meeting,
 *   warnings?: string[]  // If any participants failed to add
 * }
 * 
 * Phase 2 Design:
 * - Single API call (no loops from frontend)
 * - Members are reused across meetings
 * - Clear separation of storage (members, meetings) and computation (coordinates)
 */
export async function POST(request: Request) {
  try {
    // ===== Input Validation =====
    // Parse and validate the request body against schema
    const body = await request.json();
    const validatedInput = validateCreateMeetingInput(body);
    const { title, participants } = validatedInput;

    // ===== Member Creation/Lookup =====
    // For each participant, find existing member or create new one
    // Collects member IDs for the meeting record
    const memberIds: string[] = [];
    const warnings: string[] = [];

    for (const participant of participants) {
      try {
        const member = findOrCreateMember(participant.name, participant.city);
        
        // Ensure member has an ID (should always be the case)
        if (!member.id) {
          throw new Error(`Member ${participant.name} has no ID`);
        }
        
        memberIds.push(member.id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        warnings.push(`Failed to add participant ${participant.name}: ${errorMessage}`);
      }
    }

    // ===== Meeting Creation =====
    // Create meeting record with participant IDs (not full objects)
    const meeting = createMeeting(title, memberIds);

    // ===== Response =====
    // Return meeting data, include warnings if any participants failed
    return NextResponse.json({
      success: true,
      meeting,
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } catch (error) {
    // ===== Error Handling =====
    // Log error and return appropriate HTTP status
    console.error('Error creating meeting:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.message },
        { status: 400 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
