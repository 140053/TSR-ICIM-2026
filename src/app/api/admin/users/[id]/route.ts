// ─────────────────────────────────────────────────────────────
// app/api/admin/users/[id]/route.ts
// PATCH — update name / email / role
// DELETE — remove user (already in admin-api-routes.ts; shown here
//          for completeness so both are in one file)
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

// ── PATCH /api/admin/users/[id] ───────────────────────────────
const PatchSchema = z.object({
  name:  z.string().min(2).max(80).optional(),
  email: z.string().email().optional(),
  role:  z.enum(["STUDENT","TEACHER","ADMIN"] as const).optional(),
});

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const userId = parseInt(id);
  if (isNaN(userId)) {
    return NextResponse.json({ success: false, error: "Invalid ID." }, { status: 400 });
  }

  const body   = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ success: false, error: issue.message }, { status: 400 });
  }

  const { name, email, role } = parsed.data;

  // Prevent demoting or editing another admin
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
  }
  if (target.role === "ADMIN" && userId !== session.id) {
    return NextResponse.json({ success: false, error: "Cannot edit other admin accounts." }, { status: 403 });
  }

  // Check email uniqueness if changing
  if (email && email !== target.email) {
    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken) {
      return NextResponse.json(
        { success: false, error: "Email already in use.", field: "email" },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name  && { name:  name.trim() }),
      ...(email && { email: email.toLowerCase().trim() }),
      ...(role  && { role }),
    },
  });

  return NextResponse.json({ success: true, user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role } });
}

// ── DELETE /api/admin/users/[id] ──────────────────────────────
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const userId = parseInt(id);
  if (isNaN(userId)) {
    return NextResponse.json({ success: false, error: "Invalid ID." }, { status: 400 });
  }
  if (userId === session.id) {
    return NextResponse.json({ success: false, error: "Cannot delete your own account." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
  }
  if (target.role === "ADMIN") {
    return NextResponse.json({ success: false, error: "Cannot delete admin accounts." }, { status: 403 });
  }

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ success: true });
}