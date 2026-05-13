import { createClient } from "@/lib/supabase/server";
import { getDashboardPathForRole } from "@/lib/auth/roles";

export type UserProfile = {
  id: string;
  role: string | null;
  full_name: string | null;
  phone_number: string | null;
  age: number | null;
  weight: number | null;
};

export async function getCurrentUserProfile() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, full_name, phone_number, age, weight")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  return profile as UserProfile | null;
}

export async function getCurrentUserDashboardPath() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    return null;
  }

  return getDashboardPathForRole(profile.role);
}
