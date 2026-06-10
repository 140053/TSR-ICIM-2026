// app/api/admin/users/[id]/assign-teacher-sections/route.ts
//
// POST  { sectionIds: number[] }
//   Replaces the teacher's section assignments atomically:
//   - Sections in sectionIds         → set teacherId to this user (overwrites existing teacher)
//   - Sections this teacher owns but NOT in sectionIds → clear teacherId

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { z } from "zod";

const Schema = z.object({
  sectionIds: z.array(z.number().int().positive()),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const userId  = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ success: false, error: "Invalid user ID." }, { status: 400 });
    }

    const body   = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data." },
        { status: 400 }
      );
    }

    const { sectionIds } = parsed.data;

    // Verify target is a TEACHER
    const target = await prisma.user.findUnique({
      where: { id: userId }, select: { role: true },
    });

    if (!target) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }
    if (target.role !== "TEACHER") {
      return NextResponse.json(
        { success: false, error: "Only teachers can be assigned to sections." },
        { status: 400 }
      );
    }

    // Verify all requested sections exist and are active
    if (sectionIds.length > 0) {
      const count = await prisma.section.count({
        where: { id: { in: sectionIds }, isActive: true },
      });
      if (count !== sectionIds.length) {
        return NextResponse.json(
          { success: false, error: "One or more sections are invalid or inactive." },
          { status: 400 }
        );
      }
    }

    // Atomic replacement
    await prisma.$transaction(async (tx) => {
      // Clear this teacher from sections they own that are NOT in the new list
      await tx.section.updateMany({
        where: { teacherId: userId, id: { notIn: sectionIds } },
        data:  { teacherId: null },
      });

      // Assign to each selected section (overwrites whoever is there)
      if (sectionIds.length > 0) {
        await tx.section.updateMany({
          where: { id: { in: sectionIds } },
          data:  { teacherId: userId },
        });
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: sectionIds.length === 0
          ? "Teacher removed from all sections."
          : `Teacher assigned to ${sectionIds.length} section${sectionIds.length > 1 ? "s" : ""}.`,
        sectionIds,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[ADMIN/USERS/ASSIGN-TEACHER-SECTIONS]", err);
    return NextResponse.json(
      { success: false, error: "Failed to update section assignments." },
      { status: 500 }
    );
  }
}