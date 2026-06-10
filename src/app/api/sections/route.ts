import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("schoolId");

  const sections = await prisma.section.findMany({
    where: {
      isActive: true,
      ...(schoolId ? { schoolId: Number(schoolId) } : {}),
    },
    select: { id: true, name: true, emoji: true, schoolId: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ success: true, sections });
}
