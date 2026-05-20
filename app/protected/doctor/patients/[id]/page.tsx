import { redirect } from "next/navigation";

import { getCurrentUserProfile } from "@/lib/supabase/profiles";
import { createAdminClient } from "@/lib/supabase/admin";
import { PatientDetailWrapper } from "@/components/doctor/patient-detail-wrapper";
import MiniLogo from "@/components/mini-logo";
import { LogoutButton } from "@/components/logout-button";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export default async function DoctorPatientDetailPage({ params }: RouteParams) {
  const profile = await getCurrentUserProfile();

  if (!profile || profile.role !== "medico") {
    redirect("/protected");
  }

  const { id: patientId } = await params;
  const adminClient = createAdminClient();

  if (!adminClient) {
    throw new Error(
      "Falta la configuración del servidor para consultar pacientes.",
    );
  }

  const [
    { data: patient, error: patientError },
    { data: relation, error: relationError },
    { data: prescriptions, error: prescriptionsError },
  ] = await Promise.all([
    adminClient
      .from("profiles")
      .select("id, full_name, age, weight, phone_number")
      .eq("id", patientId)
      .maybeSingle(),
    adminClient
      .from("user_relations")
      .select("id")
      .eq("superior_id", profile.id)
      .eq("patient_id", patientId)
      .maybeSingle(),
    adminClient
      .from("prescriptions")
      .select(
        "id, medication_name, dosage_info, frequency_hours, stock_actual, is_active, created_at",
      )
      .eq("patient_id", patientId)
      .eq("doctor_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  // Attempt to fetch prescription changes, ignore error if table doesn't exist
  const { data: changesData } = await adminClient
    .from("prescription_changes")
    .select("*, doctor:doctor_id(full_name)")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (patientError) throw patientError;
  if (relationError) throw relationError;
  if (prescriptionsError) throw prescriptionsError;

  if (!patient || !relation) {
    redirect("/protected/doctor");
  }

  return (
    <div className="min-h-screen bg-[#BDE5FF] p-8">
      <header className="mb-8 flex items-center justify-between bg-transparent px-4">
        <div className="flex flex-col items-center">
          <MiniLogo />
        </div>
        <h1 className="text-5xl font-black tracking-[0.15em] text-[#001D3D] uppercase">
          MEDICO
        </h1>
        <LogoutButton className="rounded-2xl border border-slate-900 bg-[#C9D9E6] hover:bg-slate-300 text-black font-bold px-10 shadow-sm h-14 text-base">
          Cerrar Sesion
        </LogoutButton>
      </header>

      <main className="mx-auto w-full max-w-[98%] rounded-[40px] bg-slate-50/50 p-6 lg:p-10">
        <PatientDetailWrapper
          patient={patient}
          prescriptions={(prescriptions ?? []) as never[]}
          history={(changesData ?? []) as never[]}
        />
      </main>
    </div>
  );
}
