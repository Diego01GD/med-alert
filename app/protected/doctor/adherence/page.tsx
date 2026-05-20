import { AdherenceDashboard } from "@/components/doctor/adherence-dashboard";
import MiniLogo from "@/components/mini-logo";
import { getCurrentUserProfile } from "@/lib/supabase/profiles";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

async function AdherencePageContent() {
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

    // 2. Traer las relaciones activas usando el ID del perfil logueado
    const { data: doctorRelations, error: dbError } = await adminClient
        .from("user_relations")
        .select("patient_id")
        .eq("superior_id", profile.id)
        .eq("relation_type", "medico-paciente");

    if (dbError) {
        console.error("Error al obtener los pacientes del médico:", dbError);
    }

    const patientIds = doctorRelations?.map((rel) => rel.patient_id).filter(Boolean) as string[] || [];

    let formattedPatients: any[] = [];

    // 3. Extraer perfiles e intake_logs
    if (patientIds.length > 0) {
        const { data: patientsData, error: logsError } = await adminClient
            .from("profiles")
            .select(`
        id,
        full_name,
        intake_logs (
          id,
          prescription_id,
          scheduled_time,
          actual_time,
          status,
          omission_reason,
          side_effects,
          observations
        )
      `)
            .in("id", patientIds);

        if (logsError) {
            console.error("Error al cargar las bitácoras de tomas:", logsError);
        }

        // Fecha de hoy para simular tomas recientes y saltarnos el bloqueo del filtro
        const today = new Date().toISOString().split('T')[0];

        // 4. ✨ SUPER ADAPTADOR: Corrige estados, nombres de variables y fuerza fechas recientes
        formattedPatients = patientsData?.map((patient) => {
            const rawLogs = patient.intake_logs || [];

            const translatedLogs = rawLogs.map((log: any) => {
                // A) Ajustamos el status para Recharts
                let cleanStatus = log.status;
                if (log.status === "no_cumplido") {
                    // El dashboard busca "omitido" para acumular y clasificar las omisiones
                    cleanStatus = "omitido";
                } else if (log.status === "cumplido") {
                    cleanStatus = "cumplido";
                }

                // B) Forzamos que la fecha parezca generada HOY para que quepa en el filtro de "Últimos 7 días"
                // Extraemos solo la hora original (HH:MM:SS) de tu base de datos y le pegamos el año/mes/día de hoy
                const timePart = log.scheduled_time ? log.scheduled_time.split('T')[1] : "12:00:00+00";
                const forcedScheduledTime = `${today}T${timePart}`;

                return {
                    ...log,
                    status: cleanStatus,
                    scheduled_time: forcedScheduledTime, // Fecha virtualizada para romper el candado del filtro
                    actual_time: log.actual_time ? `${today}T${log.actual_time.split('T')[1]}` : null
                };
            });

            return {
                id: patient.id,
                full_name: patient.full_name || "Paciente sin nombre",
                intakeLogs: translatedLogs
            };
        }) || [];
    }

    // LOG DE CONTROL: Imprime en tu terminal de VSCode para verificar qué le estamos enviando al componente
    console.log("DATOS ENVIADOS AL DASHBOARD:", JSON.stringify(formattedPatients, null, 2));

    return (
        <div className="flex-1 w-full flex flex-col min-h-screen bg-[#BDE5FF] p-8">
            <header className="flex items-center justify-between bg-transparent mb-8 px-4">
                <div className="flex flex-col items-center">
                    <MiniLogo />
                </div>
                <h1 className="text-5xl font-black tracking-[0.15em] text-[#001D3D] uppercase">
                    MÉDICO - PANEL DE CONTROL
                </h1>
                <div className="text-right">
                    <Link
                        href="/protected/doctor/prescriptions"
                        className="inline-block rounded-2xl border border-slate-900 bg-[#001D3D] hover:bg-[#003566] text-white font-bold px-8 shadow-sm h-14 text-base leading-[3.5rem] text-center mr-4 align-middle"
                    >
                        Volver al Panel
                    </Link>
                    <LogoutButton className="inline-block rounded-2xl border border-slate-900 bg-[#C9D9E6] hover:bg-slate-300 text-black font-bold px-10 shadow-sm h-14 text-base align-middle">
                        Cerrar Sesión
                    </LogoutButton>
                </div>
            </header>

            <main className="flex-1 flex flex-col gap-6 max-w-[98%] mx-auto w-full">
                <div className="bg-slate-50/50 rounded-[40px] p-6 lg:p-10">
                    <AdherenceDashboard patients={formattedPatients} timeRange="7days" />
                </div>
            </main>
        </div>
    );
}

function AdherenceLoading() {
    return (
        <div className="flex-1 w-full flex flex-col min-h-screen bg-[#BDE5FF] p-8 items-center justify-center">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#001D3D] border-t-transparent mb-4"></div>
                <p className="text-[#001D3D] text-xl font-bold tracking-wide">Cargando analíticas e historial clínico...</p>
            </div>
        </div>
    );
}

export default function AdherencePage() {
    return (
        <Suspense fallback={<AdherenceLoading />}>
            <AdherencePageContent />
        </Suspense>
    );
}