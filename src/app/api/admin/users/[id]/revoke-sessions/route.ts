// app/api/admin/users/[id]/revoke-sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const userId = parseInt(id);
  if (isNaN(userId)) {
    return NextResponse.json({ success: false, error: "Invalid ID." }, { status: 400 });
  }

  const { count } = await prisma.userSession.deleteMany({ where: { userId } });
  return NextResponse.json({ success: true, revoked: count });
}