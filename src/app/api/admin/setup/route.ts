// app/api/admin/setup/route.ts
// Creates the very first ADMIN account.
// Requires ADMIN_SETUP_TOKEN in the request body to prevent
// unauthorized access. Once one admin exists this endpoint
// returns 403 on every subsequent call.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { z } from "zod";

const Schema = z.object({
  name:       z.string().min(2,  "Name is required.").max(80),
  email:      z.string().email("Enter a valid email."),
  password:   z.string().min(8,  "Password must be at least 8 characters.").max(72),
  setupToken: z.string().min(1,  "Setup token is required."),
});

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "tsr-dev-secret-change-in-production"
);

async function signToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function POST(req: NextRequest) {
  try {
    // 1. Validate body
    const body   = await req.json();
    const parsed = Schema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { success: false, error: issue.message, field: issue.path[0] },
        { status: 400 }
      );
    }

    const { name, email, password, setupToken } = parsed.data;

    // 2. Verify setup token
    const envToken = process.env.ADMIN_SETUP_TOKEN;
    if (!envToken || envToken.length < 8 || setupToken !== envToken) {
      return NextResponse.json(
        { success: false, error: "Invalid setup token." },
        { status: 403 }
      );
    }

    // 3. Only one admin can be created via this endpoint
    const existing = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An admin account already exists. Use /login." },
        { status: 403 }
      );
    }

    // 4. Check email not already in use
    const emailTaken = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (emailTaken) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists.", field: "email" },
        { status: 409 }
      );
    }

    // 5. Create admin user
    const hashed = await bcrypt.hash(password, 12);

    const admin = await prisma.user.create({
      data: {
        name:     name.trim(),
        email:    email.toLowerCase().trim(),
        password: hashed,
        role:     "ADMIN",
      },
    });

    // 6. Sign JWT + persist session
    const token = await signToken({
      sub:    String(admin.id),
      userId: admin.id,
      name:   admin.name,
      email:  admin.email,
      role:   admin.role,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.userSession.create({
      data: { userId: admin.id, token, expiresAt },
    });

    // 7. Set cookie + respond
    const response = NextResponse.json(
      { success: true, message: "Admin account created.", redirectTo: "/admin" },
      { status: 201 }
    );

    response.cookies.set("tsr_session", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge:   60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error("[ADMIN/SETUP]", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}