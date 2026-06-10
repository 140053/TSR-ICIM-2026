// app/api/admin/sections/[id]/route.ts
//
// PATCH /api/admin/sections/[id]  — edit section fields
// DELETE /api/admin/sections/[id] — delete section (blocked if students assigned)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

// ── PATCH ─────────────────────────────────────────────────────
const PatchSchema = z.object({
  name:       z.string().min(1).max(60).optional(),
  emoji:      z.string().max(4).optional(),
  gradeLevel: z.string().max(20).optional(),
  schoolYear: z.string().max(20).nullable().optional(),
  schoolId:   z.number().int().positive().nullable().optional(),
  teacherId:  z.number().int().positive().nullable().optional(),
  isActive:   z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const sectionId = parseInt(id);
  if (isNaN(sectionId)) {
    return NextResponse.json({ success: false, error: "Invalid section ID." }, { status: 400 });
  }

  const body   = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const section = await prisma.section.findUnique({ where: { id: sectionId } });
  if (!section) {
    return NextResponse.json({ success: false, error: "Section not found." }, { status: 404 });
  }

  const updated = await prisma.section.update({
    where: { id: sectionId },
    data:  parsed.data,
  });

  return NextResponse.json({ success: true, section: updated });
}

// ── DELETE ────────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const sectionId = parseInt(id);
  if (isNaN(sectionId)) {
    return NextResponse.json({ success: false, error: "Invalid section ID." }, { status: 400 });
  }

  // Block deletion if students are still assigned
  const studentCount = await prisma.studentProfile.count({
    where: { sectionId },
  });
  if (studentCount > 0) {
    return NextResponse.json(
      {
        success: false,
        error:   `Cannot delete — ${studentCount} student${studentCount > 1 ? "s are" : " is"} still assigned to this section. Reassign them first.`,
      },
      { status: 409 }
    );
  }

  // Remove module assignments and teacher link, then delete
  await prisma.moduleAssignment.deleteMany({ where: { sectionId } });
  await prisma.section.delete({ where: { id: sectionId } });

  return NextResponse.json({ success: true });
}
