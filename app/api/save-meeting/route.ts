import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const { html, filename } = await request.json();

    // write file to /public/exports/
    const exportDir = path.join(process.cwd(), "public", "exports");
    const filePath = path.join(exportDir, filename);

    fs.mkdirSync(exportDir, { recursive: true });
    fs.writeFileSync(filePath, html, "utf8");

    return NextResponse.json({ success: true, path: `/exports/${filename}` });
  } catch (error: any) {
    console.error("Save failed", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
