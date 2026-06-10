// /api/teacher/profile
// PATCH → update name and/or password for the logged-in teacher

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "TEACHER")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    name?:            string;
    currentPassword?: string;
    newPassword?:     string;
  };

  const data: { name?: string; password?: string } = {};

  // Name update
  if (body.name !== undefined) {
    const trimmed = body.name.trim();
    if (!trimmed) return NextResponse.json({ success: false, error: "Name cannot be empty." }, { status: 400 });
    data.name = trimmed;
  }

  // Password change
  if (body.newPassword !== undefined) {
    if (!body.currentPassword)
      return NextResponse.json({ success: false, error: "Current password is required." }, { status: 400 });
    if (body.newPassword.length < 6)
      return NextResponse.json({ success: false, error: "New password must be at least 6 characters." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });

    const match = await bcrypt.compare(body.currentPassword, user.password);
    if (!match)
      return NextResponse.json({ success: false, error: "Current password is incorrect." }, { status: 400 });

    data.password = await bcrypt.hash(body.newPassword, 10);
  }

  if (Object.keys(data).length === 0)
    return NextResponse.json({ success: false, error: "Nothing to update." }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: session.id },
    data,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({ success: true, user: updated });
}
