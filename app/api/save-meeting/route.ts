import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface SaveMeetingRequest {
  html: string;
  filename: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SaveMeetingRequest;
    const { html, filename } = body;

    // write file to /public/exports/
    const exportDir = path.join(process.cwd(), "public", "exports");
    const filePath = path.join(exportDir, filename);

    fs.mkdirSync(exportDir, { recursive: true });
    fs.writeFileSync(filePath, html, "utf8");

    return NextResponse.json({ success: true, path: `/exports/${filename}` });
  } catch (error) {
    console.error("Save failed", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
