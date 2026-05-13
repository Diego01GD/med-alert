import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getCurrentUserProfile } from "@/lib/supabase/profiles";
import { createAdminClient } from "@/lib/supabase/admin";
import { PrescriptionForm } from "@/components/prescriptions/prescription-form";
import { PrescriptionPatientSection } from "@/components/doctor/prescription-patient-section";
import { PrescriptionPageSkeleton } from "@/components/doctor/prescription-page-skeleton";
import MiniLogo from "@/components/mini-logo";
import { LogoutButton } from "@/components/logout-button";

interface SearchParams {
  patientId?: string;
}

type PatientData = {
  id: string;
  full_name: string | null;
  age: number | null;
  weight: number | null;
  phone_number: string | null;
};

async function PrescriptionContent({
  patientId,
}: {
  patientId: string | undefined;
}) {
  const profile = await getCurrentUserProfile();

  if (!profile || profile.role !== "medico") {
    redirect("/protected");
  }

  let patientData: PatientData | null = null;

  if (patientId) {
    const adminClient = createAdminClient();

    if (adminClient) {
      const { data: patient } = await adminClient
        .from("profiles")
        .select("id, full_name, age, weight, phone_number")
        .eq("id", patientId)
        .maybeSingle();

      if (patient) {
        patientData = patient as PatientData;
      }
    }
  }

  return (
    <>
      {/* Top Panel "Sección del paciente seleccionado" */}
      {patientData ? (
        <PrescriptionPatientSection patient={patientData} />
      ) : (
        <section className="bg-slate-300/50 border border-slate-400/30 rounded-lg p-8 flex items-center justify-center min-h-[150px]">
          <h2 className="text-xl font-bold text-slate-700">
            Selecciona un paciente para mostrar su información
          </h2>
        </section>
      )}

      {/* Bottom Panel "Sección de Stock" */}
      <section className="bg-slate-300/50 border border-slate-400/30 rounded-lg p-6 flex-1 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-center text-slate-700 uppercase">
          Sección de Stock de las recetas actuales
        </h2>

        <div className="bg-slate-400/70 border border-slate-400 rounded-lg p-8 flex-1">
          <PrescriptionForm
            patientId={patientId || null}
            patientInitialAge={patientData?.age ?? null}
            patientInitialWeight={patientData?.weight ?? null}
          />
        </div>
      </section>
    </>
  );
}

export default async function PrescriptionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const profile = await getCurrentUserProfile();

  if (!profile || profile.role !== "medico") {
    redirect("/protected");
  }

  const params = await searchParams;
  const patientId = params.patientId;

  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-gradient-to-tr from-sky-200 to-white">
      {/* Header Estilo "FARMACEUTICO" */}
      <header className="flex items-center justify-between p-6 bg-transparent">
        <div className="flex items-center gap-2">
          <MiniLogo />
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">
          FARMACEUTICO
        </h1>
        <LogoutButton className="rounded-xl border-slate-900 bg-slate-200 hover:bg-slate-300 text-black font-bold px-6">
          Cerrar Sesion
        </LogoutButton>
      </header>

      <div className="flex flex-1 p-6 gap-6">
        {/* Content Area - Ahora ocupa todo el ancho */}
        <main className="flex-1 flex flex-col gap-6">
          <Suspense fallback={<PrescriptionPageSkeleton />}>
            <PrescriptionContent patientId={patientId} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}