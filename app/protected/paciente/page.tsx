import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getCurrentUserProfile } from "@/lib/supabase/profiles";
import { createAdminClient } from "@/lib/supabase/admin";
import MiniLogo from "@/components/mini-logo";
import { LogoutButton } from "@/components/logout-button";
import { PatientDashboardClient } from "@/components/paciente/paciente-dashboard-client";

type PrescriptionRecord = {
  id: string;
  medication_name: string;
  dosage_info: {
    dose?: string;
    unit?: string;
    cantidad?: string;
    unidad?: string;
  } | null;
  frequency_hours: number | null;
  start_time: string | null;
  stock_actual: number | null;
  is_active: boolean | null;
  created_at: string | null;
};

type IntakeLogRecord = {
  id: string;
  prescription_id: string;
  scheduled_time: string;
  actual_time: string | null;
  status: string;
  omission_reason: string | null;
  side_effects: string | null;
  observations: string | null;
  created_at: string | null;
};

async function PatientDashboardContent() {
  const profile = await getCurrentUserProfile();

  if (!profile || profile.role !== "paciente") {
    redirect("/protected");
  }

  const adminClient = createAdminClient();

  if (!adminClient) {
    throw new Error(
      "Falta la configuración del servidor para consultar las prescripciones.",
    );
  }

  const { data: prescriptionsData, error: prescriptionsError } =
    await adminClient
      .from("prescriptions")
      .select(
        "id, medication_name, dosage_info, frequency_hours, start_time, stock_actual, is_active, created_at",
      )
      .eq("patient_id", profile.id)
      .order("created_at", { ascending: false });

  if (prescriptionsError) {
    throw prescriptionsError;
  }

  const prescriptions = (prescriptionsData ?? []) as PrescriptionRecord[];
  const prescriptionIds = prescriptions.map((item) => item.id);

  let intakeLogs: IntakeLogRecord[] = [];

  if (prescriptionIds.length > 0) {
    const { data: intakeLogsData, error: intakeLogsError } = await adminClient
      .from("intake_logs")
      .select(
        "id, prescription_id, scheduled_time, actual_time, status, omission_reason, side_effects, observations, created_at",
      )
      .in("prescription_id", prescriptionIds)
      .order("scheduled_time", { ascending: false });

    if (intakeLogsError) {
      throw intakeLogsError;
    }

    // Mapear los valores de la enum en la DB a los estados en español que usa la UI.
    function mapDbStatusToUi(status: string) {
      switch (status) {
        case "taken":
          return "cumplido";
        case "late":
          return "atrasado";
        case "missed":
          return "omitido";
        default:
          return status;
      }
    }

    intakeLogs = (intakeLogsData ?? []).map((row: any) => ({
      ...row,
      status: mapDbStatusToUi(row.status),
    })) as IntakeLogRecord[];
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(186,230,253,0.8),_transparent_42%),linear-gradient(180deg,_#ecfeff_0%,_#ffffff_42%,_#e0f2fe_100%)] px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <header className="grid grid-cols-3 items-center rounded-[28px] border border-slate-200/80 bg-white/85 px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex justify-start">
            <MiniLogo />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
              Panel móvil
            </span>
            <span className="text-sm font-black text-slate-900">Paciente</span>
          </div>
          <div className="flex justify-end">
            <LogoutButton className="h-10 rounded-2xl border border-slate-200 bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800">
              Cerrar sesión
            </LogoutButton>
          </div>
        </header>

        <PatientDashboardClient
          patientId={profile.id}
          patientName={profile.full_name}
          prescriptions={prescriptions}
          intakeLogs={intakeLogs}
        />
      </div>
    </div>
  );
}

function PatientDashboardFallback() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      Cargando...
    </div>
  );
}

export default function PatientDashboardPage() {
  return (
    <Suspense fallback={<PatientDashboardFallback />}>
      <PatientDashboardContent />
    </Suspense>
  );
}
