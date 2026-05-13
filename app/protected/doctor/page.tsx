import { redirect } from "next/navigation";

import { getCurrentUserProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";
import MiniLogo from "@/components/mini-logo";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";

type AssignedPatient = {
  id: string;
  full_name: string | null;
  age: number | null;
  weight: number | null;
};

type ActivePrescription = {
  id: string;
  patient_id: string;
  medication_name: string;
  dosage_info: { cantidad?: string; unidad?: string } | null;
  frequency_hours: number | null;
  stock_actual: number | null;
};

export default async function DoctorDashboardPage() {
  const profile = await getCurrentUserProfile();

  if (!profile || profile.role !== "medico") {
    redirect("/protected");
  }

  const supabase = await createClient();

  const { data: relations, error: relationsError } = await supabase
    .from("user_relations")
    .select("patient_id")
    .eq("superior_id", profile.id)
    .eq("relation_type", "medico-paciente");

  if (relationsError) {
    throw relationsError;
  }

  const patientIds = (relations ?? []).map((relation) => relation.patient_id);

  const [
    { data: patients, error: patientsError },
    { data: prescriptions, error: prescriptionsError },
  ] = await Promise.all([
    patientIds.length
      ? supabase
          .from("profiles")
          .select("id, full_name, age, weight")
          .in("id", patientIds)
      : Promise.resolve({ data: [], error: null }),
    patientIds.length
      ? supabase
          .from("prescriptions")
          .select(
            "id, patient_id, medication_name, dosage_info, frequency_hours, stock_actual",
          )
          .eq("doctor_id", profile.id)
          .in("patient_id", patientIds)
          .eq("is_active", true)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (patientsError) {
    throw patientsError;
  }

  if (prescriptionsError) {
    throw prescriptionsError;
  }

  const typedPatients = (patients ?? []) as AssignedPatient[];
  const typedPrescriptions = (prescriptions ?? []) as ActivePrescription[];

  const prescriptionsByPatient = typedPrescriptions.reduce<
    Record<string, ActivePrescription[]>
  >((accumulator, prescription) => {
    accumulator[prescription.patient_id] ??= [];
    accumulator[prescription.patient_id].push(prescription);
    return accumulator;
  }, {});

  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-[#BDE5FF] p-8">
      <header className="flex items-center justify-between bg-transparent mb-8 px-4">
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

      <main className="flex-1 flex flex-col gap-6 max-w-[98%] mx-auto w-full bg-slate-50/50 rounded-[40px] p-6 lg:p-10 mb-8">
        <section className="bg-[#A4B4C4] border border-slate-500/30 rounded-[35px] p-12 flex items-center justify-center gap-6 text-center shadow-sm">
          <InfoIcon className="h-12 w-12 text-slate-900" />
          <p className="text-xl font-bold text-slate-900 max-w-3xl leading-tight tracking-tight">
            {profile.full_name
              ? `Hola, ${profile.full_name}. Estas son tus alertas, pacientes asignados y recetas activas.`
              : "Estas son tus alertas, pacientes asignados y recetas activas."}
          </p>
        </section>

        <section className="flex-[2] bg-[#D1DEE8] border border-slate-500 rounded-lg p-10 flex flex-col gap-6 shadow-sm min-h-[500px]">
          <h2 className="text-4xl font-black text-center text-slate-900 leading-tight mb-4 tracking-tight">
            Sección de pacientes asignados
          </h2>

          <div className="flex-1 bg-[#94A4B4] border border-slate-600 rounded-lg overflow-hidden flex flex-col min-h-[400px]">
            <div className="grid grid-cols-3 bg-slate-800 text-white p-6 font-bold uppercase tracking-wider text-xl">
              <div className="px-4">Nombre del paciente</div>
              <div className="px-4 text-center">Edad</div>
              <div className="px-4 text-center">Peso</div>
            </div>

            <div className="flex-1 overflow-auto">
              {typedPatients.length > 0 ? (
                typedPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="grid grid-cols-3 items-start border-t border-slate-600/40 p-6 text-slate-900"
                  >
                    <div className="px-4">
                      <p className="font-bold text-lg">
                        {patient.full_name ?? "Paciente sin nombre"}
                      </p>
                      <div className="mt-3 space-y-2 text-sm font-medium">
                        {(prescriptionsByPatient[patient.id] ?? []).length >
                        0 ? (
                          prescriptionsByPatient[patient.id].map(
                            (prescription) => (
                              <div
                                key={prescription.id}
                                className="rounded-xl bg-slate-900/10 px-3 py-2"
                              >
                                <p className="font-bold">
                                  {prescription.medication_name}
                                </p>
                                <p>
                                  Stock: {prescription.stock_actual ?? 0} |
                                  Frecuencia:{" "}
                                  {prescription.frequency_hours ?? 0} h
                                </p>
                              </div>
                            ),
                          )
                        ) : (
                          <p className="italic opacity-80">
                            Sin recetas activas registradas.
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="px-4 text-center text-lg font-bold">
                      {patient.age ?? "N/D"}
                    </div>
                    <div className="px-4 text-center text-lg font-bold">
                      {patient.weight ?? "N/D"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center p-20">
                  <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none opacity-50">
                    Aún no hay pacientes asignados
                  </h3>
                  <p className="mt-4 max-w-2xl text-lg font-medium text-slate-700">
                    Cuando se creen relaciones en{" "}
                    <span className="font-bold">user_relations</span> con tipo{" "}
                    <span className="font-bold">medico-paciente</span>, los
                    pacientes aparecerán aquí.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
