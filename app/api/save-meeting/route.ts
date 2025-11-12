import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface SaveMeetingRequest {
  html: string;
  filename: string;
}

/**
 * Sanitize filename to prevent path traversal attacks
 */
function sanitizeFilename(filename: string): string {
  // Remove any path separators and only keep the base filename
  const basename = path.basename(filename);
  // Remove any non-alphanumeric characters except dash, underscore, and dot
  return basename.replace(/[^a-z0-9.\-_]/gi, '_');
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SaveMeetingRequest;
    const { html, filename } = body;

    // Sanitize the filename to prevent path traversal
    const safeFilename = sanitizeFilename(filename);
    
    // Validate that we have a safe filename
    if (!safeFilename?.length) {
      return NextResponse.json(
        { success: false, error: "Invalid filename" },
        { status: 400 },
      );
    }

    // write file to /public/exports/
    const exportDir = path.join(process.cwd(), "public", "exports");
    const filePath = path.join(exportDir, safeFilename);
    
    // Additional security check: ensure resolved path is still within exportDir
    const resolvedPath = path.resolve(filePath);
    const resolvedExportDir = path.resolve(exportDir);
    if (!resolvedPath.startsWith(resolvedExportDir)) {
      return NextResponse.json(
        { success: false, error: "Invalid file path" },
        { status: 400 },
      );
    }

    fs.mkdirSync(exportDir, { recursive: true });
    fs.writeFileSync(filePath, html, "utf8");

    return NextResponse.json({ success: true, path: `/exports/${safeFilename}` });
  } catch (error) {
    console.error("Save failed", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
