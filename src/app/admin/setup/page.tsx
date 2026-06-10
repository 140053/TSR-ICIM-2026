// app/admin/setup/page.tsx
// One-time admin account creation page.
// Protected by ADMIN_SETUP_TOKEN env var — if the token doesn't match,
// the page shows an error. Once an ADMIN account exists in the DB,
// the page redirects to /login automatically.
//
// Access: /admin/setup?token=YOUR_ADMIN_SETUP_TOKEN

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminSetupClient from "./_components/AdminSetupClient";


interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AdminSetupPage({ searchParams }: PageProps) {
  const setupToken = process.env.ADMIN_SETUP_TOKEN;

  // 1. If an admin already exists, redirect to login — no reason to show this page
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (existingAdmin) {
    redirect("/login?notice=admin-exists");
  }

  // 2. Validate the setup token from ?token= query param
  const { token } = await searchParams;
  const providedToken = token ?? "";
  const tokenValid =
    setupToken &&
    setupToken.length >= 8 &&
    providedToken === setupToken;

  return (
    <AdminSetupClient
      tokenValid={!!tokenValid}
      providedToken={providedToken}
    />
  );
}