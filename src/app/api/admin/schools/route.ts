import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { z } from "zod";

const CreateSchema = z.object({
  name:    z.string().min(2, "School name is required.").max(120),
  address: z.string().max(255).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const schools = await prisma.school.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { sections: true, students: true } },
      sections: {
        select: {
          id: true, name: true, emoji: true, isActive: true,
          teacher: { select: { id: true, name: true } },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  return NextResponse.json({ success: true, schools });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ success: false, error: issue.message }, { status: 400 });
  }

  const school = await prisma.school.create({ data: parsed.data });
  return NextResponse.json({ success: true, school }, { status: 201 });
}
