// POST /api/upload/module-banner
// Accepts a multipart/form-data file upload (field: "file"), saves it to
// [project-root]/uploads/modules/ (outside public/), and returns the API URL.
// Allowed: TEACHER, ADMIN.

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { randomBytes } from "crypto";

const MAX_BYTES  = 4 * 1024 * 1024; // 4 MB
const ALLOWED    = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
// Stored outside public/ so Next.js won't serve it as a static asset
export const UPLOAD_DIR = join(process.cwd(), "uploads", "modules");

export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file || typeof file === "string") {
    return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 });
  }

  const ext = extname(file.name).toLowerCase();
  if (!ALLOWED.has(ext)) {
    return NextResponse.json({ success: false, error: "Unsupported file type. Use JPG, PNG, WebP, or GIF." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ success: false, error: "File too large. Maximum 4 MB." }, { status: 400 });
  }

  const bytes    = await file.arrayBuffer();
  const buf      = Buffer.from(bytes);
  const filename = `${randomBytes(12).toString("hex")}${ext}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(join(UPLOAD_DIR, filename), buf);

  return NextResponse.json({
    success: true,
    url: `/api/uploads/module-banner/${filename}`,
  });
}
