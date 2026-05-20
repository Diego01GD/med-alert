import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/supabase/profiles";
import { createAdminClient } from "@/lib/supabase/admin";
import { CaregiverDashboard, PatientCardProps, PatientStatus } from "@/components/cuidador/caregiver-dashboard";

function formatTime(dateString: string) {
  const d = new Date(dateString);
  return d.toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
}

function formatDate(dateString: string) {
  const d = new Date(dateString);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  
  if (isToday) return `Hoy, ${formatTime(dateString)}`;
  if (isYesterday) return `Ayer, ${formatTime(dateString)}`;
  return `${d.toLocaleDateString("es-MX", { day: 'numeric', month: 'short' })}, ${formatTime(dateString)}`;
}

function calculateDelayStr(scheduled: string, actual: string | null) {
  const scheduledTime = new Date(scheduled).getTime();
  const actualTime = actual ? new Date(actual).getTime() : new Date().getTime();
  const diffMs = Math.max(0, actualTime - scheduledTime);
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (diffHours === 0 && diffMins === 0) return null;
  return `Retraso: ${diffHours}h ${diffMins}m`;
}

function deduceCondition(prescriptions: any[]) {
  if (prescriptions.length === 0) return "Control Preventivo";
  const names = prescriptions.map(p => (p.medication_name || "").toLowerCase());
  
  if (names.some(n => n.includes("digoxina"))) return "Insuficiencia Cardíaca";
  if (names.some(n => n.includes("metformina"))) return "Diabetes tipo 2";
  if (names.some(n => n.includes("losartan") || n.includes("amlodipina") || n.includes("lisinopril"))) return "Hipertensión";
  if (names.some(n => n.includes("atorvastatina") || n.includes("ezetimiba"))) return "Colesterol alto";
  if (names.some(n => n.includes("salbutamol") || n.includes("montelukast"))) return "Asma";
  if (names.some(n => n.includes("levotiroxina"))) return "Hipotiroidismo";
  if (names.some(n => n.includes("ibuprofeno"))) return "Artritis";
  
  // Default to the first medication if no recognized mapping
  const firstMed = prescriptions[0].medication_name;
  return firstMed ? `Tratamiento con ${firstMed}` : "En tratamiento";
}

export default async function CaregiverDashboardPage() {
  const profile = await getCurrentUserProfile();

  if (!profile || profile.role !== "cuidador") {
    redirect("/protected");
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    throw new Error("Falta configuración de servidor");
  }

  // 1. Get assigned patients
  const { data: relations } = await adminClient
    .from("user_relations")
    .select("patient_id")
    .eq("superior_id", profile.id)
    .eq("relation_type", "cuidador-paciente");

  const patientIds = (relations || []).map(r => r.patient_id);

  if (patientIds.length === 0) {
    return <CaregiverDashboard patients={[]} />;
  }

  // 2. Get profiles
  const { data: patientsData } = await adminClient
    .from("profiles")
    .select("id, full_name")
    .in("id", patientIds);

  const patients = patientsData || [];

  // 3. Get prescriptions
  const { data: prescriptionsData } = await adminClient
    .from("prescriptions")
    .select("*")
    .in("patient_id", patientIds)
    .eq("is_active", true);

  const prescriptions = prescriptionsData || [];

  // 4. Get recent intake logs (e.g. past 7 days)
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  const { data: intakeLogsData } = await adminClient
    .from("intake_logs")
    .select("*")
    .in("patient_id", patientIds)
    .gte("scheduled_time", lastWeek.toISOString())
    .order("scheduled_time", { ascending: false });

  const intakeLogs = intakeLogsData || [];

  // Prepare data for UI
  const patientCards: PatientCardProps[] = patients.map(p => {
    const patientPrescriptions = prescriptions.filter(pr => pr.patient_id === p.id);
    const patientLogs = intakeLogs.filter(l => l.patient_id === p.id);
    
    // Initials calculation
    const nameParts = (p.full_name || "S N").split(" ").filter(Boolean);
    const initials = nameParts.length >= 2 
      ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      : (nameParts[0]?.substring(0, 2).toUpperCase() || "SN");

    const condition = deduceCondition(patientPrescriptions);

    // Latest activity from logs
    let lastActivity = null;
    let trafficStatus: PatientStatus = "A tiempo";
    
    // Sort logs: past ones for latest activity, future ones for next take
    const now = new Date().getTime();
    const pastLogs = patientLogs.filter(l => new Date(l.scheduled_time).getTime() <= now);
    const futureLogs = patientLogs.filter(l => new Date(l.scheduled_time).getTime() > now).sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime());

    if (pastLogs.length > 0) {
      const latestLog = pastLogs[0];
      const rx = patientPrescriptions.find(pr => pr.id === latestLog.prescription_id);
      const medName = rx ? rx.medication_name : "Medicamento";
      
      const scheduledTimeMs = new Date(latestLog.scheduled_time).getTime();
      const actualTimeMs = latestLog.actual_time ? new Date(latestLog.actual_time).getTime() : now;
      const delayMs = Math.max(0, actualTimeMs - scheduledTimeMs);
      const delayHours = delayMs / (1000 * 60 * 60);

      let activityState: "Tomó a tiempo" | "Tomó con retraso" | "No tomó a tiempo" = "No tomó a tiempo";
      
      if (latestLog.status === "cumplido") {
        activityState = "Tomó a tiempo";
      } else if (latestLog.status === "atrasado") {
        activityState = "Tomó con retraso";
      } else if (latestLog.status === "no_cumplido" || latestLog.status === "omitido") {
        activityState = "No tomó a tiempo";
      }

      // Calculate traffic light based on delay of latest log
      if (activityState === "Tomó a tiempo") {
        trafficStatus = "A tiempo";
      } else if (delayHours > 3) {
        trafficStatus = "> 3h atrasado";
      } else if (delayHours >= 1) {
        trafficStatus = "1 - 2h atrasado";
      } else {
        trafficStatus = "A tiempo";
      }

      lastActivity = {
        state: activityState,
        timeStr: formatDate(latestLog.scheduled_time),
        medication: medName,
        delayStr: (activityState !== "Tomó a tiempo") ? calculateDelayStr(latestLog.scheduled_time, latestLog.actual_time) : null
      };
    }

    // Next take calculation
    let nextTake = null;
    if (futureLogs.length > 0) {
      const nextLog = futureLogs[0];
      const rx = patientPrescriptions.find(pr => pr.id === nextLog.prescription_id);
      nextTake = {
        timeStr: formatTime(nextLog.scheduled_time),
        medication: rx ? rx.medication_name : "Medicamento",
      };
    } else if (patientPrescriptions.length > 0) {
      // If no future logs generated but has active prescriptions, just show the next frequency jump
      // We take the first active prescription as fallback
      const rx = patientPrescriptions[0];
      const lastRxLog = pastLogs.find(l => l.prescription_id === rx.id);
      let nextTime = new Date();
      if (lastRxLog) {
        nextTime = new Date(lastRxLog.scheduled_time);
        if (rx.frequency_hours) {
           nextTime.setHours(nextTime.getHours() + rx.frequency_hours);
        }
      } else if (rx.start_time) {
        nextTime = new Date(rx.start_time);
        while (nextTime.getTime() < now) {
           nextTime.setHours(nextTime.getHours() + (rx.frequency_hours || 24));
        }
      }
      nextTake = {
        timeStr: formatTime(nextTime.toISOString()),
        medication: rx.medication_name,
      };
    }

    return {
      id: p.id,
      name: p.full_name || "Sin Nombre",
      initials,
      condition,
      status: trafficStatus,
      lastActivity,
      nextTake,
    };
  });

  return <CaregiverDashboard patients={patientCards} />;
}
