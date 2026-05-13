import { redirect } from "next/navigation";

import { getDashboardPathForRole } from "@/lib/auth/roles";
import { getCurrentUserProfile } from "@/lib/supabase/profiles";

export default async function ProtectedPage() {
  const profile = await getCurrentUserProfile();

  if (!profile?.role) {
    redirect("/auth/login");
  }

  const destination = getDashboardPathForRole(profile.role) ?? "/auth/login";
  redirect(destination);
}
