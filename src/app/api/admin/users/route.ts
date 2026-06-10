// app/api/admin/users/route.ts
// Admin-only: create a new user (bypasses invite codes)
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const BaseSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName:  z.string().min(1).max(50),
  email:     z.string().email(),
  password:  z.string().min(6).max(72),
});

const StudentSchema = BaseSchema.extend({
  role:      z.literal("STUDENT"),
  sectionId: z.number().int().positive().nullable(),
  schoolId:  z.number().int().positive().nullable().optional(),
});

const TeacherSchema = BaseSchema.extend({
  role:      z.literal("TEACHER"),
  subject:   z.string().min(1).max(100).optional(),
});

const AdminSchema = BaseSchema.extend({
  role: z.literal("ADMIN"),
});

const CreateUserSchema = z.discriminatedUnion("role", [
  StudentSchema,
  TeacherSchema,
  AdminSchema,
]);

export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const body   = await req.json();
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { success: false, error: issue?.message ?? "Invalid data.", field: issue?.path[0] },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Duplicate email check
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase().trim() },
  });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "An account with this email already exists.", field: "email" },
      { status: 409 }
    );
  }

  const fullName      = `${data.firstName.trim()} ${data.lastName.trim()}`;
  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name:     fullName,
        email:    data.email.toLowerCase().trim(),
        password: hashedPassword,
        role:     data.role,
      },
    });

    if (data.role === "STUDENT") {
      await tx.studentProfile.create({
        data: {
          userId:    newUser.id,
          sectionId: data.sectionId ?? null,
          schoolId:  data.schoolId  ?? null,
          setupDone: false,
        },
      });
    }

    return newUser;
  });

  return NextResponse.json(
    { success: true, userId: user.id, message: `${fullName} created successfully.` },
    { status: 201 }
  );
}
