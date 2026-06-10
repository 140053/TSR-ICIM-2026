// GET /api/uploads/module-banner/[filename]
// Serves a private module banner image for any authenticated user.
// Files are stored outside public/ so this API is the only way to access them.

import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFast } from "@/lib/auth/session";
import { readFile } from "fs/promises";
import { join, extname, basename } from "path";
import { UPLOAD_DIR } from "@/app/api/upload/module-banner/route";

const MIME: Record<string, string> = {
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png":  "image/png",
  ".webp": "image/webp",
  ".gif":  "image/gif",
};

type Ctx = { params: Promise<{ filename: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  // Any logged-in user (student, teacher, admin) can view module banners
  const session = await getSessionUserFast();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { filename } = await params;

  // Sanitize: allow only safe filenames (hex + extension, no path traversal)
  const safe = basename(filename);
  if (safe !== filename || !/^[a-f0-9]+\.(jpg|jpeg|png|webp|gif)$/i.test(safe)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext      = extname(safe).toLowerCase();
  const mimeType = MIME[ext];
  if (!mimeType) return new NextResponse("Not found", { status: 404 });

  try {
    const buf = await readFile(join(UPLOAD_DIR, safe));
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type":  mimeType,
        "Cache-Control": "private, max-age=86400", // cached for 1 day per browser
        "Content-Length": String(buf.byteLength),
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
