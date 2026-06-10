// Permanent redirect — /dashboard/teacher/modules/new is the official module creation flow.
import { redirect } from "next/navigation";

export default function CreateModuleRedirect() {
  redirect("/dashboard/teacher/modules/new");
}
