// app/api/admin/sessions/clear/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { count } = await prisma.userSession.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return NextResponse.json({ success: true, cleared: count, message: `${count} expired session(s) removed.` });
  } catch (err) {
    console.error("[ADMIN/SESSIONS/CLEAR]", err);
    return NextResponse.json({ success: false, error: "Failed to clear sessions." }, { status: 500 });
  }
}