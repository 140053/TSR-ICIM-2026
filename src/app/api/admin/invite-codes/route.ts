// app/api/admin/invite-codes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { randomBytes } from "crypto";

// GET — list all invite codes
export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const codes = await prisma.teacherInviteCode.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      usedBy:    { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({ success: true, codes });
}

const CreateSchema = z.object({
  label:     z.string().max(120).optional(),
  expiresAt: z.string().optional(), // datetime-local → "2026-04-10T12:00" or full ISO
});

// POST — generate a new code
export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const body   = await req.json().catch(() => ({}));
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid data." }, { status: 400 });
  }

  const { label, expiresAt } = parsed.data;

  // Generate a human-readable code: TSR-XXXX-XXXX
  const code = "TSR-" + randomBytes(2).toString("hex").toUpperCase() +
               "-"    + randomBytes(2).toString("hex").toUpperCase();

  const record = await prisma.teacherInviteCode.create({
    data: {
      code,
      label:       label ?? null,
      createdById: session.id,
      expiresAt:   expiresAt ? (isNaN(new Date(expiresAt).getTime()) ? null : new Date(expiresAt)) : null,
    },
  });

  return NextResponse.json({ success: true, code: record }, { status: 201 });
}
