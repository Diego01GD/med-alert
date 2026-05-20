"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  ChevronRight,
  Package,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";

export type Patient = {
  id: string;
  name: string;
  age: number;
  weight: number;
  phone: string;
  patientId: string;
  doctor: string;
  status: "Stock bajo" | "Stock OK";
  medications: Medication[];
};

export type Medication = {
  id: string;
  name: string;
  dose: string;
  stock: number;
  stockInitial: number;
  status: "Normal" | "Bajo";
  lastUpdate: string;
};

export type DrugInteraction = {
  id: number;
  med_a_name: string;
  med_b_name: string;
  severity: string;
  description: string;
};

export function PharmacistClient({
  interactions,
  dbPatients,
}: {
  interactions: DrugInteraction[];
  dbPatients?: Patient[];
}) {
  const [patientsToUse, setPatientsToUse] = useState<Patient[]>(
    dbPatients || [],
  );
  const [activePatientId, setActivePatientId] = useState<string>("");
  const [selectedMedication, setSelectedMedication] = useState<{
    patientId: string;
    medicationId: string;
    medicationName: string;
    currentStock: number;
    currentStockInitial: number;
  } | null>(null);
  const [stockToAdd, setStockToAdd] = useState("10");
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [stockMessage, setStockMessage] = useState<string | null>(null);
  const [suggestionText, setSuggestionText] = useState("");
  const [observationText, setObservationText] = useState("");
  const [suggestionMessage, setSuggestionMessage] = useState<string | null>(
    null,
  );
  const [observationMessage, setObservationMessage] = useState<string | null>(
    null,
  );
  const [isSendingSuggestion, setIsSendingSuggestion] = useState(false);
  const [isSendingObservation, setIsSendingObservation] = useState(false);

  useEffect(() => {
    setPatientsToUse(dbPatients || []);
  }, [dbPatients]);

  useEffect(() => {
    if (
      activePatientId !== "" &&
      !patientsToUse.find((p) => p.id === activePatientId)
    ) {
      setActivePatientId("");
    }
  }, [patientsToUse, activePatientId]);

  const activePatient = activePatientId
    ? patientsToUse.find((p) => p.id === activePatientId)
    : undefined;

  // Helper to check if a medication has interactions
  const hasInteraction = (medName: string) => {
    if (!medName) return false;
    const nameLower = medName.toLowerCase().split(" ")[0]; // Basic matching on first word
    return interactions.some(
      (i) =>
        i.med_a_name.toLowerCase() === nameLower ||
        i.med_b_name.toLowerCase() === nameLower,
    );
  };

  if (patientsToUse.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-500 font-medium">
          No hay pacientes asignados a este farmacéutico.
        </p>
      </div>
    );
  }

  const stockLevel = (medication: Medication) => {
    if (medication.stockInitial <= 0) {
      return 100;
    }

    return (medication.stock / medication.stockInitial) * 100;
  };

  // Calculate generic alerts for banner
  const patientsWithLowStock = patientsToUse.filter((p) =>
    p.medications.some((m) => stockLevel(m) <= 20),
  ).length;
  const patientsNeedingRefill = patientsToUse.filter((p) =>
    p.medications.some((m) => stockLevel(m) <= 10),
  ).length;

  const activePatientMedications = activePatient?.medications ?? [];
  const activePatientHasAlerts = activePatientMedications.some(
    (m) => stockLevel(m) <= 20,
  );

  const updateStock = async () => {
    if (!selectedMedication) {
      return;
    }

    const quantity = Number(stockToAdd);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setStockMessage("La cantidad debe ser un entero mayor a cero.");
      return;
    }

    setIsUpdatingStock(true);
    setStockMessage(null);

    try {
      const response = await fetch(
        `/api/prescriptions/${selectedMedication.medicationId}/stock`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity }),
        },
      );

      const data = (await response.json()) as {
        error?: string;
        prescription?: {
          id: string;
          medication_name: string;
          stock_actual: number | null;
          stock_inicial: number | null;
        };
      };

      if (!response.ok || !data.prescription) {
        setStockMessage(data.error || "No se pudo actualizar el stock.");
        return;
      }

      setPatientsToUse((currentPatients) =>
        currentPatients.map((patient) => {
          if (patient.id !== selectedMedication.patientId) {
            return patient;
          }

          const updatedMedications = patient.medications.map((medication) => {
            if (medication.id !== data.prescription?.id) {
              return medication;
            }

            const nextStock =
              data.prescription?.stock_actual ?? medication.stock;
            const nextStockInitial =
              data.prescription?.stock_inicial ?? medication.stockInitial;
            const nextStatus: Medication["status"] =
              nextStockInitial > 0 && (nextStock / nextStockInitial) * 100 <= 20
                ? "Bajo"
                : "Normal";

            return {
              ...medication,
              stock: nextStock,
              stockInitial: nextStockInitial,
              status: nextStatus,
            };
          });

          return {
            ...patient,
            medications: updatedMedications,
            status: updatedMedications.some(
              (medication) => medication.status === "Bajo",
            )
              ? "Stock bajo"
              : "Stock OK",
          };
        }),
      );

      console.log(
        `[SIMULATED MESSAGE] Recarga de stock para ${data.prescription.medication_name}: +${quantity} unidades.`,
      );

      setStockMessage(
        `Stock actualizado para ${selectedMedication.medicationName}: ${data.prescription.stock_actual} unidades.`,
      );
      setSelectedMedication(null);
    } catch {
      setStockMessage("Error de conexión al actualizar el stock.");
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const sendSuggestion = async () => {
    if (!activePatient) {
      setSuggestionMessage("Selecciona un paciente para enviar la sugerencia.");
      return;
    }

    const trimmedSuggestion = suggestionText.trim();
    if (!trimmedSuggestion) {
      setSuggestionMessage("Escribe una sugerencia antes de enviarla.");
      return;
    }

    setIsSendingSuggestion(true);
    setSuggestionMessage(null);

    try {
      console.log(
        `[SIMULATED MESSAGE] SMS al paciente ${activePatient.name} (${activePatient.phone}): ${trimmedSuggestion}`,
      );
      setSuggestionMessage(
        `Sugerencia enviada a ${activePatient.name} por SMS simulado.`,
      );
      setSuggestionText("");
    } finally {
      setIsSendingSuggestion(false);
    }
  };

  const sendObservation = async () => {
    if (!activePatient) {
      setObservationMessage(
        "Selecciona un paciente para enviar la observación.",
      );
      return;
    }

    const trimmedObservation = observationText.trim();
    if (!trimmedObservation) {
      setObservationMessage("Escribe una observación antes de enviarla.");
      return;
    }

    setIsSendingObservation(true);
    setObservationMessage(null);

    try {
      console.log(
        `[SIMULATED MESSAGE] SMS al médico ${activePatient.doctor} por el paciente ${activePatient.name}: ${trimmedObservation}`,
      );
      setObservationMessage(
        `Observación enviada al médico responsable de ${activePatient.name} por SMS simulado.`,
      );
      setObservationText("");
    } finally {
      setIsSendingObservation(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Alertas Banner */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4">
        <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-sm">
          <div className="bg-orange-100 p-2 rounded-xl">
            <Bell className="w-5 h-5 text-orange-500 fill-orange-500" />
          </div>
          <span className="font-bold text-slate-900 text-lg">Alertas</span>
        </div>

        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm text-sm border border-orange-100">
          <div className="bg-orange-100 p-1.5 rounded-lg">
            <Bell className="w-4 h-4 text-orange-500 fill-orange-500" />
          </div>
          <span className="font-semibold text-slate-800">
            {patientsWithLowStock} pacientes tienen medicamentos con stock bajo
          </span>
        </div>

        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm text-sm border border-orange-100">
          <div className="bg-orange-100 p-1.5 rounded-lg">
            <Bell className="w-4 h-4 text-orange-500 fill-orange-500" />
          </div>
          <span className="font-semibold text-slate-800">
            {patientsNeedingRefill} pacientes requieren recarga inmediata de
            medicamentos
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mt-4">
        {/* Left Sidebar - Pacientes */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold text-center mb-6 text-slate-900">
              Pacientes
            </h2>
            <div className="flex flex-col gap-3">
              {patientsToUse.map((patient) => {
                const isActive = patient.id === activePatientId;
                const patientHasLowStock = patient.medications.some(
                  (med) => stockLevel(med) <= 20,
                );
                return (
                  <button
                    key={patient.id}
                    onClick={() => setActivePatientId(patient.id)}
                    className={`flex items-center text-left w-full p-4 rounded-2xl transition-all border ${
                      isActive
                        ? "bg-[#D9C4FF] border-[#D9C4FF] shadow-sm"
                        : patientHasLowStock
                          ? "bg-white border-orange-200 hover:border-orange-300"
                          : "bg-white border-slate-200 hover:border-[#D9C4FF]"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex flex-col w-full">
                        <span className="font-bold text-slate-900 leading-tight">
                          {patient.name}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-1">
                          Edad: {patient.age} años | Peso: {patient.weight} kg
                        </span>
                        <div className="text-right w-full mt-1">
                          <span
                            className={`text-[10px] font-medium ${patientHasLowStock ? "text-orange-700" : "text-slate-600"}`}
                          >
                            {patient.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 ml-2 ${isActive ? "text-slate-900" : "text-slate-400"}`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          {!activePatient ? (
            <div className="flex min-h-[560px] items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-white/80 p-8 shadow-sm">
              <div className="text-center">
                <p className="text-3xl font-black text-slate-900">
                  Selecciona un paciente
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  El detalle, stock y acciones aparecerán aquí cuando elijas uno
                  de la lista.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Patient Info Card */}
              <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-6">
                  Información del Paciente
                </h3>
                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl font-black text-slate-900">
                    {activePatient.name}
                  </h2>
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                    <span>Edad: {activePatient.age} años</span>
                    <span className="text-slate-300 hidden md:inline">|</span>
                    <span>Peso: {activePatient.weight} kg</span>
                    <span className="text-slate-300 hidden md:inline">|</span>
                    <span>Teléfono: {activePatient.phone}</span>
                    <span className="text-slate-300 hidden md:inline">|</span>
                    <span>ID: {activePatient.patientId}</span>
                  </div>
                </div>
              </div>

              {/* Stock and actions Card */}
              <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-6">
                  Stock de Medicamentos
                </h3>
                {activePatientHasAlerts ? (
                  <p className="mb-4 text-sm font-semibold text-orange-700">
                    Este paciente tiene medicamentos con stock en aviso.
                  </p>
                ) : null}

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="text-left text-xs font-bold text-slate-700 py-3 px-4 rounded-l-lg">
                          Medicamento
                        </th>
                        <th className="text-left text-xs font-bold text-slate-700 py-3 px-4">
                          Dosis
                        </th>
                        <th className="text-left text-xs font-bold text-slate-700 py-3 px-4">
                          Stock actual
                        </th>
                        <th className="text-left text-xs font-bold text-slate-700 py-3 px-4">
                          Estado
                        </th>
                        <th className="text-left text-xs font-bold text-slate-700 py-3 px-4">
                          Ultima actualizacion
                        </th>
                        <th className="text-left text-xs font-bold text-slate-700 py-3 px-4 rounded-r-lg">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activePatientMedications.map((med, idx) => {
                        const interact = hasInteraction(med.name);
                        const level = stockLevel(med);
                        const rowTone =
                          level <= 10
                            ? "bg-red-50 border-red-200"
                            : level <= 20
                              ? "bg-orange-50 border-orange-200"
                              : "border-slate-50";
                        const statusTone =
                          level <= 10
                            ? "text-red-700 font-bold"
                            : level <= 20
                              ? "text-orange-700 font-bold"
                              : "text-slate-600";
                        return (
                          <tr
                            key={med.id || idx}
                            className={`border-b last:border-0 ${rowTone}`}
                          >
                            <td className="py-4 px-4 text-sm font-medium text-slate-900">
                              {med.name}
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600">
                              {med.dose}
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600">
                              {med.stock} Pastillas
                            </td>
                            <td className={`py-4 px-4 text-sm ${statusTone}`}>
                              {level <= 10
                                ? "Crítico"
                                : level <= 20
                                  ? "Bajo"
                                  : med.status}
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600">
                              {med.lastUpdate}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  className="bg-sky-200 p-2 rounded-xl hover:bg-sky-300 transition-colors"
                                  onClick={() => {
                                    setSelectedMedication({
                                      patientId: activePatient.id,
                                      medicationId: med.id,
                                      medicationName: med.name,
                                      currentStock: med.stock,
                                      currentStockInitial: med.stockInitial,
                                    });
                                    setStockToAdd("10");
                                    setStockMessage(null);
                                  }}
                                  title="Modificar stock"
                                >
                                  <Package className="w-6 h-6 text-white fill-sky-400" />
                                </button>
                                {interact || true ? ( // Keeping true as fallback just to match the UI if interaction logic misses
                                  <button
                                    className="p-1"
                                    title={
                                      interact
                                        ? "Tiene interacciones"
                                        : "Alerta"
                                    }
                                  >
                                    <AlertTriangle className="w-8 h-8 text-red-500 fill-red-500" />
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {activePatient.medications.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-8 text-center text-slate-500"
                          >
                            No hay medicamentos registrados para este paciente.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bottom forms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                  <div className="border border-slate-300 rounded-[20px] p-6 flex flex-col justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-4">
                        Sugerencia de medicamento
                      </h4>
                      <input
                        type="text"
                        placeholder="Escribe el nombre del medicamento genérico..."
                        value={suggestionText}
                        onChange={(event) =>
                          setSuggestionText(event.target.value)
                        }
                        className="w-full border border-slate-400 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 mb-4"
                      />
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <button
                        type="button"
                        onClick={sendSuggestion}
                        disabled={isSendingSuggestion}
                        className="bg-[#85C8E7] hover:bg-[#74B8D7] text-slate-800 font-bold py-2.5 px-8 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isSendingSuggestion
                          ? "Enviando..."
                          : "Enviar sugerencia"}
                      </button>
                      <span className="text-xs text-slate-500">
                        El paciente recibirá una notificación SMS con tu
                        sugerencia
                      </span>
                      {suggestionMessage ? (
                        <p className="text-xs font-medium text-slate-600 text-center">
                          {suggestionMessage}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="border border-slate-300 rounded-[20px] p-6 flex flex-col justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-4">
                        Reporte observación
                      </h4>
                      <textarea
                        placeholder="Escribe el nombre del medicamento genérico..."
                        value={observationText}
                        onChange={(event) =>
                          setObservationText(event.target.value)
                        }
                        className="w-full border border-slate-400 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 min-h-[80px] mb-4 resize-none"
                      />
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <button
                        type="button"
                        onClick={sendObservation}
                        disabled={isSendingObservation}
                        className="bg-[#EF4444] hover:bg-red-600 text-white font-bold py-2.5 px-8 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isSendingObservation
                          ? "Enviando..."
                          : "Enviar Observación"}
                      </button>
                      <span className="text-xs text-slate-500">
                        El médico responsable recibirá una notificación SMS
                      </span>
                      {observationMessage ? (
                        <p className="text-xs font-medium text-slate-600 text-center">
                          {observationMessage}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {stockMessage ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
          {stockMessage}
        </div>
      ) : null}

      {selectedMedication ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 px-4 py-4 sm:items-center">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_35px_120px_rgba(15,23,42,0.35)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700">
                  Ajustar stock
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-900">
                  {selectedMedication.medicationName}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Actual: {selectedMedication.currentStock} unidades. Al
                  guardar, el nuevo total se toma también como stock inicial.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMedication(null)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                Cantidad a agregar
              </label>
              <input
                type="number"
                min={1}
                value={stockToAdd}
                onChange={(event) => setStockToAdd(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                placeholder="Ej. 10"
              />
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedMedication(null)}
                className="h-12 flex-1 rounded-2xl border border-slate-300 bg-white text-sm font-bold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={updateStock}
                disabled={isUpdatingStock}
                className="h-12 flex-1 rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isUpdatingStock ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Actualizando
                  </span>
                ) : (
                  "Guardar stock"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
