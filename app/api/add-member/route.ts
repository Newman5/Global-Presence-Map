import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { cityCoords } from "~/data/cityCoords";

const filePath = path.join(process.cwd(), "src", "data", "members.json");

// define a type for your data
type Member = {
  name: string;
  city: string;
  lat: number | null;
  lng: number | null;
};

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
    const name = body.name?.trim();
    const city = body.city?.trim();

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
    const location = cityCoords[city];
    const lat = location?.lat ?? null;
    const lng = location?.lng ?? null;

    // ✅ Warn if city not found
    if (!location) {
      console.warn(
        `⚠️ City '${city}' not found in cityCoords. Add it to cityCoords.ts.`,
      );
    }

    members.push({ name, city, lat, lng });

    fs.writeFileSync(filePath, JSON.stringify(members, null, 2));

    return NextResponse.json({ message: `Added ${name} from ${city}` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
