// app/api/teacher/modules/assign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { z } from "zod";

const Schema = z.object({
  moduleId:    z.number().int().positive(),
  sections:    z.array(z.string().min(1)).min(1, "Select at least one section."),
  dueDate:     z.string().nullable().optional(),
  unlockAfter: z.number().int().min(0).nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body   = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { success: false, error: issue?.message ?? "Invalid data." },
        { status: 400 }
      );
    }

    const { moduleId, sections, dueDate, unlockAfter } = parsed.data;

    // Verify the module exists and is published
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

    // Verify sections belong to this teacher
    const teacherSections = await prisma.section.findMany({
      where: { teacherId: session.id, name: { in: sections }, isActive: true },
    });

    if (teacherSections.length === 0) {
      return NextResponse.json(
        { success: false, error: "None of the selected sections belong to your class." },
        { status: 403 }
      );
    }

    const due = dueDate ? new Date(dueDate) : null;

    // Upsert module assignments (one per section)
    await prisma.$transaction(
      teacherSections.map((sec) =>
        prisma.moduleAssignment.upsert({
          where:  { moduleId_sectionId: { moduleId, sectionId: sec.id } },
          update: { dueDate: due },
          create: { moduleId, sectionId: sec.id, dueDate: due },
        })
      )
    );

    // If unlockAfter specified, update the module's unlockAfter field
    if (unlockAfter != null) {
      await prisma.module.update({
        where: { id: moduleId },
        data:  { unlockAfter, isLocked: unlockAfter > 0 },
      });
    }

    return NextResponse.json(
      { success: true, message: `Module assigned to ${teacherSections.length} section(s).` },
      { status: 200 }
    );
  } catch (err) {
    console.error("[TEACHER/MODULES/ASSIGN]", err);
    return NextResponse.json(
      { success: false, error: "Failed to assign module." },
      { status: 500 }
    );
  }
}