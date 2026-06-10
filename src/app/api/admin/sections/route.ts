// app/api/admin/sections/route.ts
//
// POST /api/admin/sections — create a new section

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { z } from "zod";

const CreateSchema = z.object({
  name:       z.string().min(1, "Name is required.").max(60),
  emoji:      z.string().max(4).optional().default("🌲"),
  gradeLevel: z.string().max(20).optional().default("Grade 6"),
  schoolYear: z.string().max(20).nullable().optional(),
  schoolId:   z.number().int().positive().nullable().optional(),
  isActive:   z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const body   = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, emoji, gradeLevel, schoolYear, schoolId, isActive } = parsed.data;

  const section = await prisma.section.create({
    data: { name, emoji, gradeLevel, schoolYear: schoolYear ?? null, schoolId: schoolId ?? null, isActive },
  });

  return NextResponse.json({ success: true, section }, { status: 201 });
}
