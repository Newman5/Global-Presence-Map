import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { normalizeInput } from "~/lib/normalize";
import { getCityLookupResult } from "~/lib/cityCache";
import { generateId } from "~/lib/uuid";
import { validateAddMemberInput, safeValidateMembers, type Member } from "~/lib/validation";

const filePath = path.join(process.cwd(), "src", "data", "members.json");

export async function GET() {
  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ members: [] });
    }
    const fileContent = fs.readFileSync(filePath, "utf8");
    const members: Member[] = JSON.parse(fileContent) as Member[];
    
    // Validate members data
    const validatedMembers = safeValidateMembers(members);
    if (!validatedMembers) {
      console.warn("⚠️ Members data validation failed, returning raw data");
      return NextResponse.json({ members });
    }
    
    return NextResponse.json({ members: validatedMembers });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error reading file" },
      { status: 500 },
    );
  }
}

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

    // ✅ Load existing members
    let members: Member[] = [];
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf8");
      const parsedMembers = JSON.parse(fileContent) as Member[];
      const validated = safeValidateMembers(parsedMembers);
      members = validated ?? parsedMembers; // Use raw data if validation fails
    }

    // ✅ Check for duplicates (case-insensitive)
    const exists = members.some(
      (m) =>
        m.name.toLowerCase() === name.toLowerCase() &&
        m.city.toLowerCase() === city.toLowerCase(),
    );

    if (exists) {
      return NextResponse.json(
        { message: "Member already exists" },
        { status: 409 },
      );
    }

    // ✅ Lookup coordinates using city cache
    // PHASE 1 IMPROVEMENT: Do NOT persist fallback coordinates
    const lookupResult = getCityLookupResult(city);
    
    let lat: number | null = null;
    let lng: number | null = null;
    let source: 'lookup' | 'fallback' | undefined = undefined;
    let warning: string | undefined = undefined;

    if (lookupResult.found) {
      lat = lookupResult.coords.lat;
      lng = lookupResult.coords.lng;
      source = 'lookup';
    } else {
      // PHASE 1 CHANGE: Store null coordinates instead of fallback
      // This prevents permanent pollution of members.json with placeholder data
      console.warn(`⚠️ City '${city}' not found in cityCoords. Storing null coordinates.`);
      warning = `City '${city}' coordinates not found. Member added with null coordinates.`;
    }

    // ✅ Create new member with ID (PHASE 1: Introduce member IDs)
    const newMember: Member = {
      id: generateId(),
      name,
      city,
      lat,
      lng,
      source,
      createdAt: new Date().toISOString(),
    };
    
    members.push(newMember);

    // ✅ Write to file
    fs.writeFileSync(filePath, JSON.stringify(members, null, 2));

    return NextResponse.json({
      message: warning ?? `Added ${name} from ${city}`,
      member: newMember,
      warning,
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