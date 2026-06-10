// app/api/admin/invite-codes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

// PATCH — toggle isActive
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const codeId = parseInt(id);
  if (isNaN(codeId)) {
    return NextResponse.json({ success: false, error: "Invalid ID." }, { status: 400 });
  }

  const existing = await prisma.teacherInviteCode.findUnique({ where: { id: codeId } });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
  }

  const updated = await prisma.teacherInviteCode.update({
    where: { id: codeId },
    data:  { isActive: !existing.isActive },
  });

  return NextResponse.json({ success: true, isActive: updated.isActive });
}

// DELETE — remove a code (only if unused)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const codeId = parseInt(id);
  if (isNaN(codeId)) {
    return NextResponse.json({ success: false, error: "Invalid ID." }, { status: 400 });
  }

  const existing = await prisma.teacherInviteCode.findUnique({ where: { id: codeId } });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
  }

  if (existing.usedById !== null) {
    return NextResponse.json(
      { success: false, error: "Cannot delete a code that has already been used." },
      { status: 409 }
    );
  }

  await prisma.teacherInviteCode.delete({ where: { id: codeId } });
  return NextResponse.json({ success: true });
}
