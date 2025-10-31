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

// ✅ Default fallback coordinates (Bermuda Triangle!)
const FALLBACK_COORDS = { lat: 25.0, lng: -71.0 };

export async function GET() {
  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ members: [] });
    }
    const members: Member[] = JSON.parse(fs.readFileSync(filePath, "utf8"));
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
    const body = (await req.json()) as Partial<Member>;
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
      members = JSON.parse(fs.readFileSync(filePath, "utf8"));
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

    members.push({ name, city, lat, lng });

    fs.writeFileSync(filePath, JSON.stringify(members, null, 2));

    return NextResponse.json({
      message:
        source === "fallback"
          ? `Added ${name} from ${city} (fallback location)`
          : `Added ${name} from ${city}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}