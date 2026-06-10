// lib/auth/session.ts  (updated for Next.js 16 — works with proxy.ts)
//
// Key changes from the middleware.ts version:
// - getTokenFromRequest() still works — proxy.ts passes same NextRequest
// - getTokenFromCookies() uses `await cookies()` (unchanged, already async)
// - No breaking changes needed here — session logic is the same

import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────
export interface SessionUser {
  id:           number;
  name:         string;
  email:        string;
  role:         "STUDENT" | "TEACHER" | "ADMIN";
  avatar?:      string;
  avatarEmoji?: string;
  avatarName?:  string;
  difficulty?:  string;
  sectionId?:   number | null;
  setupDone?:   boolean;
  xp?:          number;
  level?:       number;
}

export interface JWTPayload {
  sub:          string;
  userId:       number;
  name:         string;
  email:        string;
  role:         "STUDENT" | "TEACHER" | "ADMIN";
  avatar?:      string;
  avatarEmoji?: string;
  difficulty?:  string;
  sectionId?:   number | null;
  setupDone?:   boolean;
  iat:          number;
  exp:          number;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "tsr-dev-secret-change-in-production"
);

// ─── Verify raw JWT ───────────────────────────────────────────
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

// ─── Extract token from API route request ─────────────────────
// Works with both proxy.ts (Next.js 16) and middleware.ts (Next.js 15)
export function getTokenFromRequest(req: NextRequest): string | null {
  const cookie = req.cookies.get("tsr_session")?.value;
  if (cookie) return cookie;

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);

  return null;
}

// ─── Extract token from Server Component ─────────────────────
// Uses next/headers cookies() — works in layouts and page components
export async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("tsr_session")?.value ?? null;
}

// ─── Full session check (API routes) — verifies JWT + DB ──────
// Use in route handlers that need to validate the user is still active.
// proxy.ts only does a JWT check; this adds the DB revocation check.
export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  // DB check — ensures session hasn't been revoked (logout, admin ban, etc.)
  const session = await prisma.userSession.findUnique({ where: { token } });
  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.userSession.delete({ where: { token } }).catch(() => {});
    return null;
  }

  return buildUser(payload);
}

// ─── Fast session check (layouts / Server Components) ─────────
// JWT-only — no DB round-trip. Use in layout.tsx for quick auth gates.
// proxy.ts already validated the JWT so this is just reading the cookie.
export async function getSessionUserFast(): Promise<SessionUser | null> {
  const token = await getTokenFromCookies();
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return buildUser(payload);
}

// ─── Read user from headers (set by proxy.ts) ─────────────────
// Available in Server Components via next/headers — zero crypto work.
export async function getUserFromHeaders(): Promise<Pick<SessionUser, "id" | "name" | "email" | "role"> | null> {
  const { headers } = await import("next/headers");
  const h = await headers();

  const id   = h.get("x-user-id");
  const role = h.get("x-user-role") as SessionUser["role"] | null;
  const email = h.get("x-user-email");
  const name  = h.get("x-user-name");

  if (!id || !role || !email || !name) return null;

  return { id: Number(id), role, email, name };
}

// ─── Private helper ───────────────────────────────────────────
function buildUser(payload: JWTPayload): SessionUser {
  return {
    id:          payload.userId,
    name:        payload.name,
    email:       payload.email,
    role:        payload.role,
    avatar:      payload.avatar,
    avatarEmoji: payload.avatarEmoji,
    difficulty:  payload.difficulty,
    sectionId:   payload.sectionId,
    setupDone:   payload.setupDone,
  };
}