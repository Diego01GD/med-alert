import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";

import { getCurrentUserProfile } from "@/lib/supabase/profiles";
import MiniLogo from "@/components/mini-logo";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PharmacistClient, Patient, Medication } from "./pharmacist-client";

function getStockPercentage(stockActual: number, stockInitial: number) {
  if (stockInitial <= 0) {
    return 100;
  }

  return (stockActual / stockInitial) * 100;
}

export default async function PharmacistDashboardPage() {
  const profile = await getCurrentUserProfile();

  if (!profile || profile.role !== "farmaceutico") {
    redirect("/protected");
  }

  const supabase = await createClient();
  const { data: interactions, error: interactionsError } = await supabase
    .from("drug_interactions")
    .select("*");

  if (interactionsError) {
    console.error("Error fetching drug interactions:", interactionsError);
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    throw new Error(
      "Falta la configuración del servidor para consultar base de datos.",
    );
  }

  const { data: relations } = await adminClient
    .from("user_relations")
    .select("patient_id")
    .eq("superior_id", profile.id)
    .eq("relation_type", "farmaceutico-paciente");

  const patientIds = Array.from(
    new Set((relations || []).map((r: any) => r.patient_id)),
  );

  const { data: patientsData } =
    patientIds.length > 0
      ? await adminClient
          .from("profiles")
          .select("id, full_name, age, weight, phone_number")
          .in("id", patientIds)
      : { data: [] };

  const { data: prescriptionsData, error: prescriptionsError } =
    patientIds.length > 0
      ? await adminClient
          .from("prescriptions")
          .select(
            "id, patient_id, doctor_id, medication_name, dosage_info, frequency_hours, stock_actual, stock_inicial, created_at, is_active",
          )
          .in("patient_id", patientIds)
      : { data: [], error: null };

  if (prescriptionsError) {
    console.error("Error fetching prescriptions:", prescriptionsError);
  }

  const latestDoctorByPatient = new Map<string, string>();
  const doctorIds = new Set<string>();

  (prescriptionsData || [])
    .slice()
    .sort((left: any, right: any) => {
      const leftTime = left.created_at
        ? new Date(left.created_at).getTime()
        : 0;
      const rightTime = right.created_at
        ? new Date(right.created_at).getTime()
        : 0;
      return rightTime - leftTime;
    })
    .forEach((prescription: any) => {
      if (
        !latestDoctorByPatient.has(prescription.patient_id) &&
        prescription.doctor_id
      ) {
        latestDoctorByPatient.set(
          prescription.patient_id,
          prescription.doctor_id,
        );
        doctorIds.add(prescription.doctor_id);
      }
    });

  const { data: doctorsData } =
    doctorIds.size > 0
      ? await adminClient
          .from("profiles")
          .select("id, full_name")
          .in("id", Array.from(doctorIds))
      : { data: [] };

  const doctorNameById = new Map(
    (doctorsData || []).map((doctor: any) => [
      doctor.id,
      doctor.full_name || "Médico",
    ]),
  );

  const dbPatients: Patient[] = (patientsData || []).map((p: any) => {
    const pMeds = (prescriptionsData || []).filter(
      (med: any) => med.patient_id === p.id && med.is_active,
    );
    const medications: Medication[] = pMeds.map((m: any) => ({
      id: m.id,
      name: m.medication_name,
      dose: `${m.dosage_info?.dose || "1 tableta"} cada ${m.frequency_hours || 12} horas`,
      stock: m.stock_actual || 0,
      stockInitial: m.stock_inicial ?? m.stock_actual ?? 0,
      status:
        getStockPercentage(
          m.stock_actual || 0,
          m.stock_inicial ?? m.stock_actual ?? 0,
        ) <= 20
          ? "Bajo"
          : "Normal",
      lastUpdate: m.created_at
        ? new Date(m.created_at).toLocaleDateString()
        : "N/A",
    }));

    const stockStatus =
      medications.length > 0 && medications.some((m) => m.status === "Bajo")
        ? "Stock bajo"
        : "Stock OK";

    return {
      id: p.id,
      name: p.full_name || "Sin nombre",
      age: p.age || 0,
      weight: p.weight || 0,
      phone: p.phone_number || "No registrado",
      patientId: `PA-${p.id.substring(0, 4)}`,
      doctor:
        doctorNameById.get(latestDoctorByPatient.get(p.id) || "") || "N/A",
      status: stockStatus,
      medications,
    };
  });

  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-gradient-to-br from-[#E0F2FE] via-[#F0F9FF] to-[#E0F2FE] p-8">
      <header className="flex items-center justify-between mb-8">
        <MiniLogo />
        <div className="flex flex-col items-center">
          <h1 className="text-[40px] font-black text-slate-900 leading-none">
            Farmacéutico
          </h1>
          <span className="text-slate-600 text-sm mt-1">
            Panel de Farmacéutico
          </span>
        </div>
        <LogoutButton className="rounded-xl bg-[#EF4444] hover:bg-red-600 text-white font-bold px-6 shadow-sm h-11 flex items-center gap-2">
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </LogoutButton>
      </header>

      <PharmacistClient
        interactions={interactions || []}
        dbPatients={dbPatients}
      />
    </div>
  );
}
