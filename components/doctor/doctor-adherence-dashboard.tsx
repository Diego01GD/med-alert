import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserProfile } from "@/lib/supabase/profiles";
import { AdherenceDashboard } from "./adherence-dashboard";

type PatientRelation = {
  patient_id: string;
};

type IntakeLog = {
  id: string;
  prescription_id: string;
  scheduled_time: string;
  actual_time: string | null;
  status: string;
  omission_reason: string | null;
  observations: string | null;
};

type PatientProfile = {
  id: string;
  full_name: string;
};

export async function DoctorAdherenceDashboard() {
  const profile = await getCurrentUserProfile();

  if (!profile || profile.role !== "medico") {
    return <div>No tienes acceso a esta sección</div>;
  }

  const adminClient = createAdminClient();

  if (!adminClient) {
    throw new Error(
      "Falta la configuración del servidor para consultar pacientes."
    );
  }

  // Get all patients assigned to this doctor
  const { data: relations, error: relationsError } = await adminClient
    .from("user_relations")
    .select("patient_id")
    .eq("superior_id", profile.id);

  if (relationsError) {
    throw relationsError;
  }

  const uniquePatientIds = Array.from(
    new Set(
      (relations ?? []).map((relation: PatientRelation) => relation.patient_id)
    )
  );

  if (uniquePatientIds.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">No tienes pacientes asignados aún.</p>
      </div>
    );
  }

  // Get patient profiles
  const { data: patients, error: patientsError } = await adminClient
    .from("profiles")
    .select("id, full_name")
    .in("id", uniquePatientIds);

  if (patientsError) {
    throw patientsError;
  }

  const typedPatients = (patients ?? []) as PatientProfile[];

  // Get intake logs for all patients
  const { data: intakeLogs, error: intakeLogsError } = await adminClient
    .from("intake_logs")
    .select(
      "id, prescription_id, scheduled_time, actual_time, status, omission_reason, observations"
    )
    .in("patient_id", uniquePatientIds);

  if (intakeLogsError) {
    throw intakeLogsError;
  }

  const typedIntakeLogs = (intakeLogs ?? []) as IntakeLog[];

  // Map logs to patients
  const patientsWithLogs = typedPatients.map((patient) => ({
    id: patient.id,
    full_name: patient.full_name,
    intakeLogs: typedIntakeLogs.filter((log) => {
      // Get patient_id from prescription for this log
      // Note: We might need to join with prescriptions table to get the patient_id
      // For now, we'll filter based on patient assignment
      return true;
    }),
  }));

  // Actually, we need to get the patient_id from the intake_logs table or join with prescriptions
  // Let's restructure the query
  const { data: enrichedLogs, error: enrichedLogsError } = await adminClient
    .from("intake_logs")
    .select("id, patient_id, prescription_id, scheduled_time, actual_time, status, omission_reason, observations")
    .in("patient_id", uniquePatientIds);

  if (enrichedLogsError) {
    throw enrichedLogsError;
  }

  const typedEnrichedLogs = (enrichedLogs ?? []) as (IntakeLog & { patient_id: string })[];

  // Map logs to patients correctly
  const finalPatientsWithLogs = typedPatients.map((patient) => ({
    id: patient.id,
    full_name: patient.full_name,
    intakeLogs: typedEnrichedLogs
      .filter((log) => log.patient_id === patient.id)
      .map((log) => ({
        id: log.id,
        prescription_id: log.prescription_id,
        scheduled_time: log.scheduled_time,
        actual_time: log.actual_time,
        status: (log.status as "cumplido" | "atrasado" | "omitido") || "omitido",
        omission_reason: log.omission_reason,
        observations: log.observations,
      })),
  }));

  return (
    <AdherenceDashboard
      patients={finalPatientsWithLogs}
      timeRange="7days"
    />
  );
}
