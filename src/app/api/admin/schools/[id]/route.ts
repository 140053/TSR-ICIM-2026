import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { z } from "zod";

const PatchSchema = z.object({
  name:     z.string().min(2).max(120).optional(),
  address:  z.string().max(255).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const schoolId = Number(id);
  if (isNaN(schoolId)) return NextResponse.json({ success: false, error: "Invalid ID." }, { status: 400 });

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
  }

  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) return NextResponse.json({ success: false, error: "School not found." }, { status: 404 });

  const updated = await prisma.school.update({ where: { id: schoolId }, data: parsed.data });
  return NextResponse.json({ success: true, school: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const schoolId = Number(id);
  if (isNaN(schoolId)) return NextResponse.json({ success: false, error: "Invalid ID." }, { status: 400 });

  const [studentCount, sectionCount] = await Promise.all([
    prisma.studentProfile.count({ where: { schoolId } }),
    prisma.section.count({ where: { schoolId } }),
  ]);

  if (studentCount > 0) {
    return NextResponse.json(
      { success: false, error: `Cannot delete — ${studentCount} student(s) are assigned to this school.` },
      { status: 409 }
    );
  }
  if (sectionCount > 0) {
    return NextResponse.json(
      { success: false, error: `Cannot delete — ${sectionCount} section(s) are assigned to this school. Reassign them first.` },
      { status: 409 }
    );
  }

  await prisma.school.delete({ where: { id: schoolId } });
  return NextResponse.json({ success: true });
}
