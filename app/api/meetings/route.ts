import { NextResponse } from "next/server";
import { validateCreateMeetingInput } from "~/lib/validation";
import { findOrCreateMember } from "~/lib/members";
import { createMeeting } from "~/lib/meetings";

/**
 * POST /api/meetings
 * Creates a new meeting with participants
 * 
 * Phase 2 Implementation:
 * - Single API call for entire meeting (no loop)
 * - Members are reused across meetings
 * - Clear separation of storage and computation
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedInput = validateCreateMeetingInput(body);
    const { title, participants } = validatedInput;

    // Find or create members
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

    // Create meeting with participant IDs
    const meeting = createMeeting(title, memberIds);

    return NextResponse.json({
      success: true,
      meeting,
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } catch (error) {
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
