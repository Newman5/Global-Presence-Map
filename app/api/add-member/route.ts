//Writes new entries into src/data/members.json.
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { name, city } = await req.json();

    if (!name || !city) {
      return NextResponse.json(
        { message: "Missing name or city" },
        { status: 400 },
      );
    }

    const filePath = path.join(process.cwd(), "src", "data", "members.json");

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
