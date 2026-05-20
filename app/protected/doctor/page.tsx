import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

import { getCurrentUserProfile } from "@/lib/supabase/profiles";
import { createAdminClient } from "@/lib/supabase/admin";
import MiniLogo from "@/components/mini-logo";
import { LogoutButton } from "@/components/logout-button";
import { DoctorPatientsList } from "@/components/doctor/doctor-patients-list";
import { DoctorDashboardSkeleton } from "@/components/doctor/doctor-dashboard-skeleton";
import { InfoIcon, AlertTriangle } from "lucide-react";

type AssignedPatient = {
  id: string;
  full_name: string | null;
  age: number | null;
  weight: number | null;
};

type PatientRelation = {
  patient_id: string;
};

async function DoctorPatientContent() {
  const profile = await getCurrentUserProfile();

  if (!profile || profile.role !== "medico") {
    redirect("/protected");
  }

  const adminClient = createAdminClient();

  if (!adminClient) {
    throw new Error(
      "Falta la configuración del servidor para consultar pacientes asignados.",
    );
  }

  const { data: relations, error: relationsError } = await adminClient
    .from("user_relations")
    .select("patient_id")
    .eq("superior_id", profile.id);

  if (relationsError) {
    throw relationsError;
  }

  const uniquePatientIds = Array.from(
    new Set(
      (relations ?? []).map((relation: PatientRelation) => relation.patient_id),
    ),
  );

  const { data: patients, error: patientsError } = uniquePatientIds.length
    ? await adminClient
        .from("profiles")
        .select(`
          id,
          full_name,
          age,
          weight,
          intake_logs (
            id,
            status,
            omission_reason
          )
        `)
        .in("id", uniquePatientIds)
    : { data: [], error: null };

  if (patientsError) {
    throw patientsError;
  }

  const typedPatients = (patients ?? []).map((p: any) => ({
    id: p.id,
    full_name: p.full_name,
    age: p.age,
    weight: p.weight,
  })) as AssignedPatient[];

  // Calcular adherencia e identificar alertas
  const lowAdherenceList: { name: string; adherence: number }[] = [];

  (patients ?? []).forEach((patient: any) => {
    const rawLogs = patient.intake_logs || [];
    let onTimeCount = 0;
    let totalCount = 0;

    rawLogs.forEach((log: any) => {
      if (log.status === "cumplido" || log.status === "atrasado") {
        onTimeCount++;
      }
      totalCount++;
    });

    const adherence = totalCount > 0 ? Math.round((onTimeCount / totalCount) * 100) : 0;

    // Aún si su adherencia marque 0% (sin bitácoras o sin tomas cumplidas)
    if (adherence < 70) {
      lowAdherenceList.push({
        name: patient.full_name || "Paciente sin nombre",
        adherence,
      });
    }
  });

  const hasAlerts = lowAdherenceList.length > 0;

  return (
    <>
      {hasAlerts ? (
        <section className="bg-red-50 border-2 border-red-400 rounded-[35px] p-8 shadow-md">
          {/* Cabecera */}
          <div className="flex items-center gap-5">
            <div className="flex-shrink-0 bg-red-500 text-white rounded-2xl w-20 h-20 flex flex-col items-center justify-center shadow-lg">
              <span className="text-4xl font-black leading-none">{lowAdherenceList.length}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest leading-tight">
                {lowAdherenceList.length === 1 ? "paciente" : "pacientes"}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-6 w-6 text-red-600 animate-pulse" />
                <p className="text-2xl font-black text-red-800 leading-tight">Baja adherencia detectada</p>
              </div>
              <p className="text-sm font-medium text-red-700">
                Tienes <span className="font-extrabold">{lowAdherenceList.length} {lowAdherenceList.length === 1 ? "paciente" : "pacientes"}</span> por debajo del porcentaje de adherencia esperado del 70% (incluyendo aquellos con 0% de adherencia).
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-[#A4B4C4] border border-slate-500/30 rounded-[35px] p-12 flex items-center justify-center gap-6 text-center shadow-sm">
          <InfoIcon className="h-12 w-12 text-slate-900" />
          <p className="text-xl font-bold text-slate-900 max-w-3xl leading-tight tracking-tight">
            {profile.full_name
              ? `Hola, ${profile.full_name}. Estas son tus alertas, pacientes asignados y recetas activas.`
              : "Estas son tus alertas, pacientes asignados y recetas activas."}
          </p>
        </section>
      )}

      <section className="flex-[2] bg-[#D1DEE8] border border-slate-500 rounded-lg p-10 flex flex-col gap-6 shadow-sm min-h-[500px]">
        <h2 className="text-4xl font-black text-center text-slate-900 leading-tight mb-4 tracking-tight">
          Sección de pacientes asignados
        </h2>

        <DoctorPatientsList patients={typedPatients} />
      </section>
    </>
  );
}

export default async function DoctorDashboardPage() {
  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-[#BDE5FF] p-8">
      <header className="flex items-center justify-between bg-transparent mb-8 px-4">
        <div className="flex flex-col items-center">
          <MiniLogo />
        </div>
        <h1 className="text-5xl font-black tracking-[0.15em] text-[#001D3D] uppercase">
          MEDICO
        </h1>
        <div className="text-right">
          <Link
            href="/protected/doctor/adherence"
            className="inline-block rounded-2xl border border-slate-900 bg-[#001D3D] hover:bg-[#003566] text-white font-bold px-8 shadow-sm h-14 text-base leading-[3.5rem] text-center mr-4 align-middle"
          >
            Ver Analíticas Generales
          </Link>
          <LogoutButton className="inline-block rounded-2xl border border-slate-900 bg-[#C9D9E6] hover:bg-slate-300 text-black font-bold px-10 shadow-sm h-14 text-base align-middle">
            Cerrar Sesion
          </LogoutButton>
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-6 max-w-[98%] mx-auto w-full bg-slate-50/50 rounded-[40px] p-6 lg:p-10 mb-8">
        <Suspense fallback={<DoctorDashboardSkeleton />}>
          <DoctorPatientContent />
        </Suspense>
      </main>
    </div>
  );
}
