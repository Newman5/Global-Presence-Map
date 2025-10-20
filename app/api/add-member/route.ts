//Writes new entries into src/data/members.json.
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "src", "data", "members.json");

export async function GET() {
  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ members: [] });
    }
    const members = JSON.parse(fs.readFileSync(filePath, "utf8"));
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
    const { name, city } = await req.json();

    if (!name || !city) {
      return NextResponse.json(
        { message: "Missing name or city" },
        { status: 400 },
      );
    }

    let members: any[] = [];
    if (fs.existsSync(filePath)) {
      members = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }

    members.push({ name, city });
    fs.writeFileSync(filePath, JSON.stringify(members, null, 2));

    return NextResponse.json({ message: `Added ${name} from ${city}` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
