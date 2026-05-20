import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/supabase/profiles";
import { createAdminClient } from "@/lib/supabase/admin";
import { CaregiverPatientDetail } from "@/components/cuidador/patient-detail-view";
import MiniLogo from "@/components/mini-logo";
import { LogoutButton } from "@/components/logout-button";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export default async function CaregiverPatientDetailPage({ params }: RouteParams) {
  const profile = await getCurrentUserProfile();

  if (!profile || profile.role !== "cuidador") {
    redirect("/protected");
  }

  const { id: patientId } = await params;
  const adminClient = createAdminClient();

  if (!adminClient) {
    throw new Error("Falta la configuración del servidor para consultar pacientes.");
  }

  // Ensure this patient is actually assigned to this caregiver
  const { data: relation, error: relationError } = await adminClient
    .from("user_relations")
    .select("id")
    .eq("superior_id", profile.id)
    .eq("patient_id", patientId)
    .eq("relation_type", "cuidador-paciente")
    .maybeSingle();

  if (relationError) throw relationError;
  
  if (!relation) {
    redirect("/protected/cuidador");
  }

  const [
    { data: patient, error: patientError },
    { data: prescriptions, error: prescriptionsError },
  ] = await Promise.all([
    adminClient
      .from("profiles")
      .select("id, full_name, age, weight, phone_number")
      .eq("id", patientId)
      .maybeSingle(),
    adminClient
      .from("prescriptions")
      .select("id, medication_name, dosage_info, frequency_hours, stock_actual, is_active, created_at")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false }),
  ]);

  if (patientError) throw patientError;
  if (prescriptionsError) throw prescriptionsError;

  if (!patient) {
    redirect("/protected/cuidador");
  }

  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-[#F8FAFC]">
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <MiniLogo />
        </div>
        <LogoutButton className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:bg-red-50 bg-transparent hover:text-red-700 px-4 py-2 rounded-lg transition-colors shadow-none border-none">
          Cerrar Sesión
        </LogoutButton>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-8">
        <CaregiverPatientDetail
          patient={patient}
          prescriptions={(prescriptions ?? []) as never[]}
        />
      </main>
    </div>
  );
}
