import { redirect } from "next/navigation";
import { getSessionUserFast } from "@/lib/auth/session";

export default async function DashboardPage() {
  const session = await getSessionUserFast();

  if (!session) redirect("/login");

  if (session.role === "TEACHER") redirect("/dashboard/teacher");
  if (session.role === "STUDENT") redirect("/dashboard/student");
  if (session.role === "ADMIN")   redirect("/admin");

  redirect("/login");
}
