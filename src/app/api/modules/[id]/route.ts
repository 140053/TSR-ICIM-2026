// app/api/modules/[id]/route.ts
//
// GET /api/modules/[id]
//   Returns module metadata + all 12 stages (ordered by stageNumber).
//   correctAnswer is intentionally omitted — never sent to the client.
//   Accessible by STUDENT, TEACHER, and ADMIN roles.

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const moduleId = parseInt(id);
    if (isNaN(moduleId)) {
      return NextResponse.json(
        { success: false, error: "Invalid module id." },
        { status: 400 }
      );
    }

    const module = await prisma.module.findUnique({
      where:  { id: moduleId },
      select: {
        id:           true,
        title:        true,
        subtitle:     true,
        context:      true,
        scenario:     true,
        icon:         true,
        status:       true,
        gradeLevel:   true,
        timeEstimate: true,
        melcTags:     true,
        stages: {
          orderBy: { stageNumber: "asc" },
          select: {
            id:          true,
            stageNumber: true,
            phase:       true,
            title:       true,
            instruction: true,
            type:        true,
            hint:        true,
            options:     true,
            maxScore:    true,
            timeLimit:   true,
            melc:        true,
            // correctAnswer deliberately excluded
          },
        },
      },
    });

    if (!module) {
      return NextResponse.json(
        { success: false, error: "Module not found." },
        { status: 404 }
      );
    }

    if (module.status === "ARCHIVED") {
      return NextResponse.json(
        { success: false, error: "Module is no longer available." },
        { status: 410 }
      );
    }

    return NextResponse.json({ success: true, module }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/modules/[id]]", err);
    return NextResponse.json(
      { success: false, error: "Failed to load module." },
      { status: 500 }
    );
  }
}
