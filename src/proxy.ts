// proxy.ts — Next.js 16 middleware
//
// Security note (CVE-2025-29927):
//  This is a first-line check only. Always verify the session again
//  inside layouts (getSessionUserFast) and API routes (getSessionUser).

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// ─── JWT secret ───────────────────────────────────────────────
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "tsr-dev-secret-change-in-production"
);

// ─── Route tables ─────────────────────────────────────────────
const PUBLIC_PREFIXES = ["/", "/login", "/register", "/admin/login", "/api/auth/"];
const AUTH_PREFIXES   = ["/onboarding", "/api/auth/me", "/api/onboarding", "/api/modules"];

const ROLE_PREFIXES: { prefix: string; role: "STUDENT" | "TEACHER" | "ADMIN" }[] = [
  { prefix: "/dashboard/student", role: "STUDENT" },
  { prefix: "/api/student",       role: "STUDENT" },
  { prefix: "/dashboard/teacher", role: "TEACHER" },
  { prefix: "/api/teacher",       role: "TEACHER" },
  { prefix: "/admin",             role: "ADMIN"   },
  { prefix: "/api/admin",         role: "ADMIN"   },
];

// ─── Helpers ──────────────────────────────────────────────────
function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(p === "/" ? p : p + "/")
  );
}

function isPublicPath(pathname: string): boolean {
  return matchesPrefix(pathname, PUBLIC_PREFIXES);
}

function isProtectedPath(pathname: string): boolean {
  const allProtected = [
    ...AUTH_PREFIXES,
    ...ROLE_PREFIXES.map((r) => r.prefix),
  ];
  return matchesPrefix(pathname, allProtected);
}

function getRequiredRole(pathname: string): "STUDENT" | "TEACHER" | "ADMIN" | null {
  return ROLE_PREFIXES.find((r) => pathname.startsWith(r.prefix))?.role ?? null;
}

function isApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

function defaultDashboard(role: string): string {
  if (role === "TEACHER") return "/dashboard/teacher";
  if (role === "ADMIN")   return "/admin";
  return "/dashboard/student";
}

function toLogin(req: NextRequest, from: string): NextResponse {
  if (isApiPath(from)) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 }
    );
  }
  const loginPath = from.startsWith("/admin") ? "/admin/login" : "/login";
  const url = new URL(loginPath, req.url);
  url.searchParams.set("redirect", from);
  return NextResponse.redirect(url);
}

// ─── Token payload ────────────────────────────────────────────
interface TSRPayload {
  userId:    number;
  name:      string;
  email:     string;
  role:      "STUDENT" | "TEACHER" | "ADMIN";
  setupDone: boolean | undefined;
}

async function verifyToken(token: string): Promise<TSRPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TSRPayload;
  } catch {
    return null;
  }
}

function extractToken(req: NextRequest): string | null {
  const cookie = req.cookies.get("tsr_session")?.value;
  if (cookie) return cookie;

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);

  return null;
}

// ─── Proxy ────────────────────────────────────────────────────
export async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // 1. Skip static assets and Next.js internals
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Public paths — pass through
  //    But if the user already has a valid token and visits /login or
  //    /register, redirect them straight to their dashboard.
  if (isPublicPath(pathname)) {
    if (pathname === "/login" || pathname === "/register" || pathname === "/admin/login") {
      const token = extractToken(req);
      if (token) {
        const payload = await verifyToken(token);
        if (payload) {
          return NextResponse.redirect(
            new URL(defaultDashboard(payload.role), req.url)
          );
        }
      }
    }
    return NextResponse.next();
  }

  // 3. Not a known protected path — let Next.js handle (404, etc.)
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  // 4. Protected path — require a valid token
  const token = extractToken(req);
  if (!token) return toLogin(req, pathname);

  const payload = await verifyToken(token);
  if (!payload) {
    const res = toLogin(req, pathname);
    res.cookies.set("tsr_session", "", { maxAge: 0, path: "/" });
    return res;
  }

  // 5. Role-based access control
  const requiredRole = getRequiredRole(pathname);
  if (requiredRole && payload.role !== requiredRole) {
    if (isApiPath(pathname)) {
      return NextResponse.json(
        { success: false, error: `Access denied. Requires ${requiredRole} role.` },
        { status: 403 }
      );
    }
    return NextResponse.redirect(
      new URL(defaultDashboard(payload.role), req.url)
    );
  }

  // 6. Student onboarding gate
  if (
    payload.role === "STUDENT" &&
    payload.setupDone === false &&
    pathname.startsWith("/dashboard/student")
  ) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // 7. Inject user context into headers for Server Components
  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-user-id",    String(payload.userId));
  reqHeaders.set("x-user-role",  payload.role);
  reqHeaders.set("x-user-email", payload.email);
  reqHeaders.set("x-user-name",  payload.name);

  return NextResponse.next({ request: { headers: reqHeaders } });
}

// ─── Matcher ──────────────────────────────────────────────────
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
