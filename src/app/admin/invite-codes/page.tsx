// app/admin/invite-codes/page.tsx
import { redirect } from "next/navigation";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import InviteCodesClient from "./_components/InviteCodesClient";

export type InviteCodeRow = {
  id:          number;
  code:        string;
  label:       string | null;
  isActive:    boolean;
  expiresAt:   string | null;
  createdAt:   string;
  createdBy:   string;
  usedBy:      string | null;
  usedByEmail: string | null;
  usedAt:      string | null;
};

export default async function InviteCodesPage() {
  const session = await getSessionUserFast();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const raw = await prisma.teacherInviteCode.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      usedBy:    { select: { name: true, email: true } },
    },
  });

  const now = new Date();
  const codes: InviteCodeRow[] = raw.map((c) => ({
    id:          c.id,
    code:        c.code,
    label:       c.label,
    isActive:    c.isActive && (!c.expiresAt || c.expiresAt > now),
    expiresAt:   c.expiresAt ? c.expiresAt.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : null,
    createdAt:   c.createdAt.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }),
    createdBy:   c.createdBy.name,
    usedBy:      c.usedBy?.name ?? null,
    usedByEmail: c.usedBy?.email ?? null,
    usedAt:      c.usedAt ? c.usedAt.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : null,
  }));

  return <InviteCodesClient codes={codes} adminId={session.id} />;
}
