// app/admin/application-flow/page.tsx
// Server Component — auth guard only; all rendering is client-side.

import { redirect }           from "next/navigation";
import { getSessionUserFast } from "@/lib/auth/session";
import WorkflowDiagram        from "./_components/WorkflowDiagram";

export default async function ApplicationFlowPage() {
  const session = await getSessionUserFast();
  if (!session || session.role !== "ADMIN") redirect("/login");

  return <WorkflowDiagram />;
}
