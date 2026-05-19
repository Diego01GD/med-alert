"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Clock3, Loader2, Pill, X } from "lucide-react";

import { Button } from "@/components/ui/button";

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

type IntakeStatus = "cumplido" | "atrasado" | "omitido";
type IntakeAction = "taken" | "missed";

type PatientDashboardClientProps = {
  patientId: string;
  patientName: string | null;
  prescriptions: PrescriptionRecord[];
  intakeLogs: IntakeLogRecord[];
};

type PendingAction = {
  prescription: PrescriptionRecord;
  scheduledTime: string;
  actualTime: string | null;
  status: IntakeStatus;
  action: IntakeAction;
};

type PendingTakeAction = {
  prescription: PrescriptionRecord;
  scheduledTime: string;
  actualTime: string;
  status: "cumplido";
};

type PendingMissedConfirmAction = {
  prescription: PrescriptionRecord;
  scheduledTime: string;
  actualTime: string;
};

type FormState = {
  omissionReason: string;
  sideEffects: string;
  observations: string;
};

type NoticeItem = {
  id: string;
  title: string;
  description: string;
  tone: "info" | "warning" | "critical";
  dueAt: string;
};

const HOUR_MS = 60 * 60 * 1000;
const reasonOptions = [
  "Olvido",
  "No tenía el medicamento",
  "No pude tomarlo a tiempo",
  "Otro",
];

const sideEffectOptions = [
  "Ninguno",
  "Náusea",
  "Mareo",
  "Dolor de cabeza",
  "Somnolencia",
  "Otro",
];

function formatTime(value: string | null) {
  if (!value) return "Sin registro";

  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) return "Sin registro";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDoseInfo(dosageInfo: PrescriptionRecord["dosage_info"]) {
  if (!dosageInfo) return "Sin dosis";

  const dose = dosageInfo.dose ?? dosageInfo.cantidad;
  const unit = dosageInfo.unit ?? dosageInfo.unidad;

  if (dose && unit) return `${dose} ${unit}`;
  if (dose) return dose;
  if (unit) return unit;

  return "Sin dosis";
}

function groupLogsByPrescription(logs: IntakeLogRecord[]) {
  const grouped = new Map<string, IntakeLogRecord[]>();

  logs
    .slice()
    .sort(
      (left, right) =>
        new Date(left.scheduled_time).getTime() -
        new Date(right.scheduled_time).getTime(),
    )
    .forEach((log) => {
      const current = grouped.get(log.prescription_id) ?? [];
      current.push(log);
      grouped.set(log.prescription_id, current);
    });

  return grouped;
}

function getReferenceStartTime(prescription: PrescriptionRecord) {
  return (
    prescription.start_time ??
    prescription.created_at ??
    new Date().toISOString()
  );
}

function getNextScheduledTime(
  prescription: PrescriptionRecord,
  logs: IntakeLogRecord[],
) {
  const frequencyHours = prescription.frequency_hours ?? 0;

  if (frequencyHours <= 0) {
    return null;
  }

  if (logs.length === 0) {
    return getReferenceStartTime(prescription);
  }

  const lastLog = logs[logs.length - 1];
  // Usar actual_time (cuándo realmente se tomó) como referencia, no scheduled_time
  const referenceTime = lastLog.actual_time ?? lastLog.scheduled_time;
  const lastTimeMs = new Date(referenceTime).getTime();
  return new Date(lastTimeMs + frequencyHours * HOUR_MS).toISOString();
}

function getFirstTakenAt(logs: IntakeLogRecord[]) {
  const firstTakenLog = logs.find((log) => log.actual_time !== null);
  return firstTakenLog?.actual_time ?? null;
}

function getStatusLabel(
  logs: IntakeLogRecord[],
  nextScheduledTime: string | null,
) {
  if (logs.length === 0) {
    return "Sin primera toma";
  }

  const lastLog = logs[logs.length - 1];

  if (lastLog.status === "omitido") {
    return "Omitida";
  }

  if (lastLog.status === "atrasado") {
    return "Registrada tarde";
  }

  if (!nextScheduledTime) {
    return "Programada";
  }

  return new Date(nextScheduledTime).getTime() <= Date.now()
    ? "Pendiente"
    : "Programada";
}

function getMinutesDifference(left: string, right: string) {
  return (new Date(left).getTime() - new Date(right).getTime()) / 60000;
}

function getTakeAttemptState(minutesDifference: number) {
  if (minutesDifference > 10) {
    return "block" as const;
  }

  if (minutesDifference < -5) {
    return "confirm" as const;
  }

  return "allow" as const;
}

function buildNoticeItems(
  views: Array<{
    prescription: PrescriptionRecord;
    nextScheduledTime: string | null;
  }>,
  now: number,
) {
  const items: NoticeItem[] = [];

  views.forEach((view) => {
    if (!view.nextScheduledTime) {
      return;
    }

    const scheduledAt = new Date(view.nextScheduledTime).getTime();
    const minutesUntil = (scheduledAt - now) / 60000;

    if (minutesUntil <= 15 && minutesUntil > 5) {
      items.push({
        id: `${view.prescription.id}-15m`,
        title: "Aviso de toma próxima",
        description: `${view.prescription.medication_name} se debe tomar en 15 minutos.`,
        tone: "info",
        dueAt: view.nextScheduledTime,
      });
    }

    if (minutesUntil <= 5 && minutesUntil >= 0) {
      items.push({
        id: `${view.prescription.id}-5m`,
        title: "Aviso urgente",
        description: `${view.prescription.medication_name} se debe tomar en 5 minutos.`,
        tone: "warning",
        dueAt: view.nextScheduledTime,
      });
    }

    if (minutesUntil < -10) {
      items.push({
        id: `${view.prescription.id}-late`,
        title: "Toma no registrada",
        description: `${view.prescription.medication_name} no fue registrada 10 minutos después de la hora programada.`,
        tone: "critical",
        dueAt: view.nextScheduledTime,
      });
    }
  });

  return items.sort((left, right) => {
    const toneOrder = { critical: 0, warning: 1, info: 2 } as const;
    return (
      toneOrder[left.tone] - toneOrder[right.tone] ||
      new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime()
    );
  });
}

export function PatientDashboardClient({
  patientId,
  patientName,
  prescriptions,
  intakeLogs,
}: PatientDashboardClientProps) {
  const [records, setRecords] = useState(intakeLogs);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [pendingTakeAction, setPendingTakeAction] =
    useState<PendingTakeAction | null>(null);
  const [pendingMissedConfirmAction, setPendingMissedConfirmAction] =
    useState<PendingMissedConfirmAction | null>(null);
  const [formState, setFormState] = useState<FormState>({
    omissionReason: "",
    sideEffects: "Ninguno",
    observations: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  const activePrescriptions = useMemo(
    () => prescriptions.filter((item) => item.is_active !== false),
    [prescriptions],
  );

  const logsByPrescription = useMemo(
    () => groupLogsByPrescription(records),
    [records],
  );

  const prescriptionViews = useMemo(() => {
    return activePrescriptions
      .map((prescription) => {
        const logs = logsByPrescription.get(prescription.id) ?? [];
        const nextScheduledTime = getNextScheduledTime(prescription, logs);
        const firstTakenAt = getFirstTakenAt(logs);
        const nextScheduledValue = nextScheduledTime
          ? new Date(nextScheduledTime).getTime()
          : null;
        const dueMinutes = nextScheduledValue
          ? Math.round((nextScheduledValue - Date.now()) / 60000)
          : null;

        return {
          prescription,
          logs,
          firstTakenAt,
          nextScheduledTime,
          dueMinutes,
          hasFirstTake: Boolean(firstTakenAt),
          statusLabel: getStatusLabel(logs, nextScheduledTime),
        };
      })
      .sort((left, right) => {
        const leftTime = left.nextScheduledTime
          ? new Date(left.nextScheduledTime).getTime()
          : Number.MAX_SAFE_INTEGER;
        const rightTime = right.nextScheduledTime
          ? new Date(right.nextScheduledTime).getTime()
          : Number.MAX_SAFE_INTEGER;

        return leftTime - rightTime;
      });
  }, [activePrescriptions, logsByPrescription]);

  const dueNowPrescription = useMemo(() => {
    return (
      prescriptionViews.find(
        (item) =>
          item.nextScheduledTime !== null &&
          new Date(item.nextScheduledTime).getTime() <= Date.now(),
      ) ??
      prescriptionViews[0] ??
      null
    );
  }, [prescriptionViews]);

  const pendingFirstTakeCount = prescriptionViews.filter(
    (item) => !item.hasFirstTake,
  ).length;

  const noticeItems = useMemo(
    () => buildNoticeItems(prescriptionViews, now),
    [prescriptionViews, now],
  );

  // const completedCount = prescriptionViews.filter(
  //   (item) => item.hasFirstTake,
  // ).length;

  async function saveRecord(payload: {
    prescription: PrescriptionRecord;
    scheduledTime: string;
    actualTime: string | null;
    status: IntakeStatus;
    omissionReason?: string | null;
    sideEffects?: string | null;
    observations?: string | null;
  }) {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/patient/intake-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prescriptionId: payload.prescription.id,
          scheduledTime: payload.scheduledTime,
          actualTime: payload.actualTime,
          status: payload.status,
          omissionReason: payload.omissionReason ?? null,
          sideEffects: payload.sideEffects ?? null,
          observations: payload.observations ?? null,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        record?: IntakeLogRecord;
      };

      if (!response.ok || !data.record) {
        setErrorMessage(data.error ?? "No se pudo guardar el registro.");
        return;
      }

      setRecords((current) => [...current, data.record as IntakeLogRecord]);
      setPendingAction(null);
      setFormState({
        omissionReason: "",
        sideEffects: "Ninguno",
        observations: "",
      });
    } catch {
      setErrorMessage("Error de conexión al guardar el registro.");
    } finally {
      setIsSaving(false);
    }
  }

  function startTakenFlow(view: (typeof prescriptionViews)[number]) {
    const actualTime = new Date().toISOString();
    const scheduledTime =
      view.nextScheduledTime ?? getReferenceStartTime(view.prescription);
    const differenceMinutes = getMinutesDifference(actualTime, scheduledTime);
    const attemptState = getTakeAttemptState(differenceMinutes);

    if (attemptState === "block") {
      setErrorMessage(
        "La toma ya superó los 10 minutos de retraso. Regístrala como no cumplido.",
      );
      return;
    }

    if (attemptState === "confirm") {
      setPendingTakeAction({
        prescription: view.prescription,
        scheduledTime,
        actualTime,
        status: "cumplido",
      });
      return;
    }

    void saveRecord({
      prescription: view.prescription,
      scheduledTime,
      actualTime,
      status: "cumplido",
    });
  }

  function startMissedFlow(view: (typeof prescriptionViews)[number]) {
    const scheduledTime =
      view.nextScheduledTime ?? getReferenceStartTime(view.prescription);
    const actualTime = new Date().toISOString();
    setPendingMissedConfirmAction({
      prescription: view.prescription,
      scheduledTime,
      actualTime,
    });
  }

  const topTitle = dueNowPrescription
    ? "Medicamento a tomar ahora"
    : "Sin dosis pendientes ahora";

  const topSubtitle = dueNowPrescription
    ? dueNowPrescription.hasFirstTake
      ? "Confirma la toma o registra si se omitió."
      : "Registra la primera toma y arranca el horario."
    : "Tus medicamentos aparecerán aquí en cuanto tengan una próxima toma.";

  return (
    <main className="space-y-4 pb-8" data-patient-id={patientId}>
      {errorMessage ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {errorMessage}
        </section>
      ) : null}

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700">
              Avisos
            </p>
          </div>
          <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {noticeItems.length > 0 ? (
            noticeItems.map((notice) => {
              const toneClasses =
                notice.tone === "critical"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : notice.tone === "warning"
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-cyan-200 bg-cyan-50 text-cyan-800";

              return (
                <article
                  key={notice.id}
                  className={`rounded-3xl border p-4 ${toneClasses}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-white/80 p-2 shadow-sm">
                      <Clock3 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black">{notice.title}</p>
                      <p className="mt-1 text-sm leading-6">
                        {notice.description}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              No hay avisos activos en este momento.
            </div>
          )}
        </div>
      </section>

      {pendingFirstTakeCount > 0 ? (
        <section className="rounded-[28px] border border-white/80 bg-slate-900 px-5 py-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-200">
            Tratamiento de hoy
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">
            Hola, {patientName ?? "paciente"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            La primera toma fija el horario base. Cada toma siguiente se calcula
            según la frecuencia de la prescripción.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-300">
                Prescripciones
              </p>
              <p className="mt-1 text-2xl font-black">
                {activePrescriptions.length}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-300">
                Sin primera toma
              </p>
              <p className="mt-1 text-2xl font-black">
                {pendingFirstTakeCount}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700">
              Siguiente acción
            </p>
            <h3 className="mt-1 text-xl font-black text-slate-900">
              {topTitle}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {topSubtitle}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
            <Clock3 className="h-5 w-5" />
          </div>
        </div>

        {dueNowPrescription ? (
          <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xl font-black text-slate-900">
                  {dueNowPrescription.prescription.medication_name}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Dosis:{" "}
                  {formatDoseInfo(dueNowPrescription.prescription.dosage_info)}
                </p>
              </div>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
                {dueNowPrescription.statusLabel}
              </span>
            </div>

            <div
              className={`mt-4 grid gap-3 text-sm ${dueNowPrescription.hasFirstTake ? "grid-cols-2" : "grid-cols-1"}`}
            >
              <div className="rounded-2xl bg-white p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  Hora programada
                </p>
                <p className="mt-1 font-black text-slate-900">
                  {dueNowPrescription.hasFirstTake
                    ? formatTime(dueNowPrescription.nextScheduledTime)
                    : "Se establece en la primera toma"}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  Frecuencia
                </p>
                <p className="mt-1 font-black text-slate-900">
                  Cada {dueNowPrescription.prescription.frequency_hours ?? "-"}{" "}
                  hrs
                </p>
              </div>
            </div>

            <div
              className={`mt-4 grid gap-3 ${dueNowPrescription.hasFirstTake ? "grid-cols-2" : "grid-cols-1"}`}
            >
              <Button
                type="button"
                onClick={() => startTakenFlow(dueNowPrescription)}
                disabled={
                  isSaving ||
                  getTakeAttemptState(
                    getMinutesDifference(
                      new Date().toISOString(),
                      dueNowPrescription.nextScheduledTime ??
                        getReferenceStartTime(dueNowPrescription.prescription),
                    ),
                  ) === "block"
                }
                className="h-12 rounded-2xl bg-emerald-500 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600"
              >
                Cumplido
              </Button>
              {dueNowPrescription.hasFirstTake && (
                <Button
                  type="button"
                  onClick={() => startMissedFlow(dueNowPrescription)}
                  disabled={isSaving}
                  className="h-12 rounded-2xl bg-red-500 text-sm font-bold text-white shadow-sm transition hover:bg-red-600"
                >
                  No cumplido
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700">
              Dosis del día
            </p>
            <h3 className="mt-1 text-xl font-black text-slate-900">
              {activePrescriptions.length} medicamentos activos
            </h3>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {prescriptionViews.length > 0 ? (
            prescriptionViews.map((view) => {
              const statusTone =
                view.statusLabel === "Pendiente" ||
                view.statusLabel === "Sin primera toma"
                  ? "bg-amber-100 text-amber-700"
                  : view.statusLabel === "Omitida"
                    ? "bg-red-100 text-red-700"
                    : view.statusLabel === "Registrada tarde"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-emerald-100 text-emerald-700";

              return (
                <article
                  key={view.prescription.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-2xl bg-white p-2 text-cyan-700 shadow-sm">
                        <Pill className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-black text-slate-900">
                          {view.prescription.medication_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          {formatDoseInfo(view.prescription.dosage_info)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${statusTone}`}
                    >
                      {view.statusLabel}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-600">
                    <div className="rounded-2xl bg-white p-3">
                      <p className="uppercase tracking-[0.18em] text-slate-400">
                        Hora programada
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-900">
                        {view.hasFirstTake
                          ? formatDateTime(view.nextScheduledTime)
                          : "Primera toma aun no registrada"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white p-3">
                      <p className="uppercase tracking-[0.18em] text-slate-400">
                        Estado
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-900">
                        {view.statusLabel}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-600">
              <AlertCircle className="mx-auto h-6 w-6 text-slate-400" />
              <p className="mt-3 font-semibold">
                Todavía no hay prescripciones activas.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
          <span className="font-medium">Tomas registradas</span>
          <span className="font-black text-slate-900">{completedCount}</span>
        </div>
      </section> */}

      {pendingAction ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 px-4 py-4 sm:items-center">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_35px_120px_rgba(15,23,42,0.35)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700">
                  {pendingAction.status === "omitido"
                    ? "Registrar no cumplido"
                    : "Toma a destiempo"}
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-900">
                  {pendingAction.prescription.medication_name}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Programada para {formatTime(pendingAction.scheduledTime)}.
                  {pendingAction.actualTime
                    ? ` Se está registrando a las ${formatTime(pendingAction.actualTime)}.`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {getTakeAttemptState(
              getMinutesDifference(
                new Date().toISOString(),
                dueNowPrescription.nextScheduledTime ??
                  getReferenceStartTime(dueNowPrescription.prescription),
              ),
            ) === "block" ? (
              <p className="mt-3 text-sm font-medium text-rose-600">
                La toma superó los 10 minutos de retraso.
              </p>
            ) : null}

            <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {pendingAction.status === "atrasado"
                ? "La toma se está registrando con al menos 10 minutos de diferencia respecto a la hora programada."
                : "Indica por qué no se cumplió esta toma."}
            </div>

            <div className="mt-4 space-y-4">
              <label className="block space-y-2 text-sm font-semibold text-slate-900">
                Motivo
                <select
                  value={formState.omissionReason}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      omissionReason: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-cyan-500"
                >
                  <option value="">Selecciona una opción</option>
                  {reasonOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2 text-sm font-semibold text-slate-900">
                ¿Hubo algún efecto adverso?
                <select
                  value={formState.sideEffects}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      sideEffects: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-cyan-500"
                >
                  {sideEffectOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              {(formState.omissionReason === "Otro" ||
                formState.sideEffects === "Otro") && (
                <label className="block space-y-2 text-sm font-semibold text-slate-900">
                  Detalles adicionales
                  <textarea
                    value={formState.observations}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        observations: event.target.value.slice(0, 150),
                      }))
                    }
                    placeholder="Describe el motivo o efecto adverso..."
                    rows={4}
                    maxLength={150}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-cyan-500"
                  />
                  <span className="block text-right text-[11px] font-medium text-slate-400">
                    {formState.observations.length}/150
                  </span>
                </label>
              )}
            </div>

            <div className="mt-5 flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPendingAction(null)}
                className="h-12 flex-1 rounded-2xl border-slate-300 bg-white text-sm font-bold text-slate-700"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!pendingAction) return;

                  void saveRecord({
                    prescription: pendingAction.prescription,
                    scheduledTime: pendingAction.scheduledTime,
                    actualTime: pendingAction.actualTime,
                    status: pendingAction.status,
                    omissionReason: formState.omissionReason || null,
                    sideEffects: formState.sideEffects || null,
                    observations: formState.observations || null,
                  });
                }}
                disabled={isSaving}
                className="h-12 flex-1 rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando
                  </span>
                ) : (
                  "Guardar registro"
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingMissedConfirmAction ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 px-4 py-4 sm:items-center">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_35px_120px_rgba(15,23,42,0.35)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700">
                  Confirmar no cumplido
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-900">
                  {pendingMissedConfirmAction.prescription.medication_name}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  ¿Seguro que deseas registrar esta toma como no cumplido?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPendingMissedConfirmAction(null)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPendingMissedConfirmAction(null)}
                className="h-12 flex-1 rounded-2xl border-slate-300 bg-white text-sm font-bold text-slate-700"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!pendingMissedConfirmAction) return;

                  setPendingAction({
                    prescription: pendingMissedConfirmAction.prescription,
                    scheduledTime: pendingMissedConfirmAction.scheduledTime,
                    actualTime: pendingMissedConfirmAction.actualTime,
                    status: "omitido",
                    action: "missed",
                  });
                  setFormState({
                    omissionReason: "",
                    sideEffects: "Ninguno",
                    observations: "",
                  });
                  setPendingMissedConfirmAction(null);
                }}
                disabled={isSaving}
                className="h-12 flex-1 rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                Continuar
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingTakeAction ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 px-4 py-4 sm:items-center">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_35px_120px_rgba(15,23,42,0.35)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700">
                  Confirmar toma
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-900">
                  {pendingTakeAction.prescription.medication_name}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Esta toma está fuera del rango de 5 minutos antes de la hora
                  programada. ¿Deseas registrarla de todos modos?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPendingTakeAction(null)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPendingTakeAction(null)}
                className="h-12 flex-1 rounded-2xl border-slate-300 bg-white text-sm font-bold text-slate-700"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!pendingTakeAction) return;

                  void saveRecord({
                    prescription: pendingTakeAction.prescription,
                    scheduledTime: pendingTakeAction.scheduledTime,
                    actualTime: pendingTakeAction.actualTime,
                    status: pendingTakeAction.status,
                    omissionReason: null,
                    sideEffects: "Ninguno",
                    observations: null,
                  });

                  setPendingTakeAction(null);
                }}
                disabled={isSaving}
                className="h-12 flex-1 rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando
                  </span>
                ) : (
                  "Sí, registrar"
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
