import { NextResponse } from "next/server";
import { validateAddMemberInput } from "~/lib/validation";
import { normalizeInput } from "~/lib/normalize";
import { findOrCreateMember, loadMembers } from "~/lib/members";

/**
 * GET /api/add-member
 * Returns all members
 */
export async function GET() {
  try {
    const members = loadMembers();
    return NextResponse.json({ members });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error reading file" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/add-member
 * Legacy endpoint - use /api/meetings for new code
 * Phase 3: Simplified to use members service
 */
export async function POST(req: Request) {
  try {
    // ✅ Parse and validate input
    const body = (await req.json()) as { name?: string; city?: string };
    
    // Validate input structure
    const validationResult = validateAddMemberInput(body);
    const name = normalizeInput(validationResult.name);
    const city = normalizeInput(validationResult.city);

    if (!name || !city) {
      return NextResponse.json(
        { message: "Missing name or city after normalization" },
        { status: 400 },
      );
    }

    // Use the members service (Phase 3)
    const member = findOrCreateMember(name, city);

    return NextResponse.json({
      message: `Added ${name} from ${city}`,
      member,
    });
  } catch (error) {
    console.error(error);
    
    // Provide more helpful error messages for validation failures
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { message: "Invalid input data", error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}