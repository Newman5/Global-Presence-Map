import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { cityCoords } from "~/data/cityCoords";
import { normalizeInput } from "~/lib/normalize";

const filePath = path.join(process.cwd(), "src", "data", "members.json");

// define a type for your data
type Member = {
  name: string;
  city: string;
  lat: number | null;
  lng: number | null;
  source?: string;
};

// ✅ Default fallback coordinates: (25.0, -71.0) is in the Atlantic Ocean, often humorously referred to as the "Bermuda Triangle" and used as a placeholder when a city's coordinates are unknown.
const FALLBACK_COORDS = { lat: 25.0, lng: -71.0 };

export async function GET() {
  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ members: [] });
    }
    const fileContent = fs.readFileSync(filePath, "utf8");
    const members: Member[] = JSON.parse(fileContent) as Member[];
    return NextResponse.json({ members });
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
    // ✅ Safely parse and validate
    const body = (await req.json()) as { name?: string; city?: string };
    const name = normalizeInput(body.name);
    const city = normalizeInput(body.city);

    if (!name || !city) {
      return NextResponse.json(
        { message: "Missing name or city" },
        { status: 400 },
      );
    }

    // ✅ Safely load members
    let members: Member[] = [];
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf8");
      members = JSON.parse(fileContent) as Member[];
    }

    // ✅ Lookup coordinates safely using ??

    // Case-insensitive lookup
    const normalizedCity = city.toLowerCase();
    const location = Object.entries(cityCoords).find(
      ([key]) => key.toLowerCase() === normalizedCity,
    )?.[1];
    let source = "lookup";
    let lat = location?.lat ?? null;
    let lng = location?.lng ?? null;

    // ✅ Warn if city not found
    if (!location) {
      console.warn(
        `⚠️ City '${city}' not found in cityCoords. Using fallback.`,
      );
      lat = FALLBACK_COORDS.lat;
      lng = FALLBACK_COORDS.lng;
      source = "fallback";
    }
    // ✅ Deduplicate by name + city (case-insensitive)
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

    // ✅ Add new member
    const newMember: Member = {
      name,
      city,
      lat,
      lng,
    };
    members.push(newMember);

    fs.writeFileSync(filePath, JSON.stringify(members, null, 2));

    return NextResponse.json({
      message:
        source === "fallback"
          ? `Added ${name} from ${city} (fallback location)`
          : `Added ${name} from ${city}`,
      member: newMember,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}