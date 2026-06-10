import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { z } from "zod";

const Schema = z.object({
  sectionIds: z.array(z.number().int().positive()),
  dueDate:    z.string().nullable().optional(),
});

// POST — replace all assignments for this module with the given set of sectionIds
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const moduleId = parseInt(id);
  if (isNaN(moduleId)) {
    return NextResponse.json({ success: false, error: "Invalid module ID." }, { status: 400 });
  }

  const body   = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data." },
      { status: 400 }
    );
  }

  const { sectionIds, dueDate } = parsed.data;

  const module = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!module) {
    return NextResponse.json({ success: false, error: "Module not found." }, { status: 404 });
  }
  if (module.status === "DRAFT") {
    return NextResponse.json(
      { success: false, error: "Draft modules cannot be assigned. Publish the module first." },
      { status: 422 }
    );
  }

  // Validate all given sectionIds exist
  if (sectionIds.length > 0) {
    const found = await prisma.section.findMany({
      where: { id: { in: sectionIds } },
      select: { id: true },
    });
    if (found.length !== sectionIds.length) {
      return NextResponse.json({ success: false, error: "One or more sections not found." }, { status: 400 });
    }
  }

  const due = dueDate ? new Date(dueDate) : null;

  await prisma.$transaction(async (tx) => {
    // Remove assignments no longer in the list
    await tx.moduleAssignment.deleteMany({
      where: {
        moduleId,
        sectionId: { notIn: sectionIds },
      },
    });

    // Upsert assignments for selected sections
    for (const sectionId of sectionIds) {
      await tx.moduleAssignment.upsert({
        where:  { moduleId_sectionId: { moduleId, sectionId } },
        update: { dueDate: due },
        create: { moduleId, sectionId, dueDate: due },
      });
    }
  });

  return NextResponse.json({
    success: true,
    message: sectionIds.length === 0
      ? "All assignments removed."
      : `Module assigned to ${sectionIds.length} section(s).`,
    assignedCount: sectionIds.length,
  });
}
