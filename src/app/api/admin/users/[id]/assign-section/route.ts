// app/api/admin/users/[id]/assign-section/route.ts
//
// POST  { sectionId: number | null }
//   sectionId = number  → assigns the student to that section
//   sectionId = null    → removes the student from their current section

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { z } from "zod";

const Schema = z.object({
  sectionId: z.number().int().positive().nullable(),
  schoolId:  z.number().int().positive().nullable().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth — admin only
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    // 2. Parse target user id
    const { id } = await params;
    const userId  = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID." },
        { status: 400 }
      );
    }

    // 3. Validate body
    const body   = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data." },
        { status: 400 }
      );
    }

    const { sectionId, schoolId: bodySchoolId } = parsed.data;

    // 4. Verify target is a student with a profile
    const profile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Student profile not found. Only students can be assigned to sections." },
        { status: 404 }
      );
    }

    // 5. If assigning to a section, verify it exists and derive schoolId from it
    let resolvedSchoolId: number | null = bodySchoolId ?? null;
    if (sectionId !== null) {
      const section = await prisma.section.findUnique({
        where: { id: sectionId, isActive: true },
      });
      if (!section) {
        return NextResponse.json(
          { success: false, error: "Section not found or inactive." },
          { status: 404 }
        );
      }
      // Use the section's schoolId if the caller didn't override it
      if (bodySchoolId === undefined) resolvedSchoolId = section.schoolId ?? null;
    } else {
      // Removing section — also clear school unless caller specified one
      if (bodySchoolId === undefined) resolvedSchoolId = null;
    }

    // 6. Verify school exists if one was specified
    if (resolvedSchoolId !== null) {
      const school = await prisma.school.findUnique({ where: { id: resolvedSchoolId } });
      if (!school) {
        return NextResponse.json(
          { success: false, error: "School not found." },
          { status: 404 }
        );
      }
    }

    // 7. Update the student's section and school
    await prisma.studentProfile.update({
      where: { userId },
      data:  { sectionId, schoolId: resolvedSchoolId },
    });

    return NextResponse.json(
      {
        success:   true,
        message:   sectionId
          ? "Student assigned to section successfully."
          : "Student removed from section.",
        sectionId,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[ADMIN/USERS/ASSIGN-SECTION]", err);
    return NextResponse.json(
      { success: false, error: "Failed to update section assignment." },
      { status: 500 }
    );
  }
}