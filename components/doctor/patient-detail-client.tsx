"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, PencilLine, Save, X, Activity, ClipboardList, History, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MedicalHistoryClient } from "./medical-history-client";
import { useRouter } from "next/navigation";

type Patient = {
  id: string;
  full_name: string | null;
  age: number | null;
  weight: number | null;
  phone_number?: string | null;
};

type PrescriptionHistory = {
  id: string;
  medication_name: string;
  dosage_info: { cantidad?: string; unidad?: string; dose?: string; unit?: string } | null;
  frequency_hours: number | null;
  stock_actual: number | null;
  is_active: boolean | null;
  created_at: string | null;
};

type PatientDetailClientProps = {
  patient: Patient;
  prescriptions: PrescriptionHistory[];
  history?: any[];
};

function formatValue(value: number | null) {
  return value === null || value === undefined ? "-" : value.toString();
}

export function PatientDetailClient({
  patient,
  prescriptions,
  history = [],
}: PatientDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"prescriptions" | "history">("prescriptions");
  
  // Patient Profile Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [age, setAge] = useState<string>(patient.age?.toString() ?? "");
  const [weight, setWeight] = useState<string>(patient.weight?.toString() ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentPatient, setCurrentPatient] = useState(patient);

  // Prescription Edit State
  const [editPrescription, setEditPrescription] = useState<PrescriptionHistory | null>(null);
  const [rxDose, setRxDose] = useState("");
  const [rxFrequency, setRxFrequency] = useState("");
  const [rxIsActive, setRxIsActive] = useState(true);
  const [rxReason, setRxReason] = useState("");
  const [rxSaving, setRxSaving] = useState(false);
  const [rxError, setRxError] = useState<string | null>(null);

  async function handleSaveProfile() {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/doctor/patients/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: age === "" ? null : Number(age),
          weight: weight === "" ? null : Number(weight),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || "No se pudo actualizar el paciente.");
        return;
      }

      setCurrentPatient((prev) => ({
        ...prev,
        age: data.patient.age,
        weight: data.patient.weight,
      }));
      setSuccessMessage("Datos actualizados correctamente.");
      setIsModalOpen(false);
    } catch (error) {
      setErrorMessage("Error de conexión al actualizar el paciente.");
    } finally {
      setIsSaving(false);
    }
  }

  const openPrescriptionEdit = (rx: PrescriptionHistory) => {
    setEditPrescription(rx);
    setRxDose(rx.dosage_info?.dose || rx.dosage_info?.cantidad || "");
    setRxFrequency(rx.frequency_hours?.toString() || "");
    setRxIsActive(rx.is_active ?? true);
    setRxReason("");
    setRxError(null);
  };

  const handleSavePrescription = async () => {
    if (!editPrescription) return;
    if (!rxReason.trim()) {
      setRxError("El motivo de la modificación es obligatorio.");
      return;
    }

    setRxSaving(true);
    setRxError(null);

    try {
      const dosage_info = {
        ...editPrescription.dosage_info,
        dose: rxDose,
      };

      const res = await fetch(`/api/doctor/prescriptions/${editPrescription.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dosage_info,
          frequency_hours: rxFrequency ? Number(rxFrequency) : null,
          is_active: rxIsActive,
          reason: rxReason,
        })
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        // If it's an HTML error page, json() will throw.
        const textError = await res.clone().text();
        console.error("API response is not JSON:", textError);
        setRxError(`Error del servidor (${res.status}): La respuesta no es JSON. Revisa la consola.`);
        return;
      }

      if (!res.ok) {
        setRxError(data?.error || "Error al actualizar prescripción.");
        return;
      }

      setEditPrescription(null);
      router.refresh(); // Refresh page to get latest prescriptions and history
    } catch (e) {
      setRxError("Error de conexión al modificar la receta.");
    } finally {
      setRxSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/protected/doctor">
          <Button
            variant="ghost"
            className="gap-2 text-slate-700 hover:text-slate-900 bg-white/50"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a lista de pacientes
          </Button>
        </Link>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="gap-2 bg-sky-500 hover:bg-sky-600 text-white shadow-sm"
        >
          <PencilLine className="h-4 w-4" />
          Editar edad/peso
        </Button>
      </div>

      <section className="grid grid-cols-1 gap-4 rounded-[24px] border border-slate-200 bg-white p-6 md:grid-cols-3 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <User size={14} /> Nombre
          </p>
          <p className="mt-2 text-lg font-black text-slate-900">
            {currentPatient.full_name ?? "-"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Edad
          </p>
          <p className="mt-2 text-lg font-black text-slate-900">
            {formatValue(currentPatient.age)} años
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Peso
          </p>
          <p className="mt-2 text-lg font-black text-slate-900">
            {formatValue(currentPatient.weight)} kg
          </p>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab("prescriptions")}
          className={`flex items-center gap-2 pb-3 px-2 border-b-2 transition-colors font-bold text-sm ${
            activeTab === "prescriptions" 
              ? "border-[#2563EB] text-[#2563EB]" 
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <ClipboardList size={18} />
          Mostrar prescripción
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 pb-3 px-2 border-b-2 transition-colors font-bold text-sm ${
            activeTab === "history" 
              ? "border-[#2563EB] text-[#2563EB]" 
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <History size={18} />
          Historial médico
        </button>
      </div>

      {activeTab === "prescriptions" && (
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-900">
              Tratamientos activos
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Prescripciones médicas registradas. Puedes modificar la prescripción actual y el cambio quedará en el historial.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Medicamento</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Dosis</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Frecuencia</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Estado</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {prescriptions.length > 0 ? (
                  prescriptions.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-800">
                        {item.medication_name ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.dosage_info?.dose || item.dosage_info?.cantidad} {item.dosage_info?.unit || item.dosage_info?.unidad}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        Cada {item.frequency_hours ?? "-"} hrs
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {item.is_active ? "Activo" : "Suspendido"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openPrescriptionEdit(item)}
                          className="text-sky-600 hover:text-sky-700 border-sky-200 hover:bg-sky-50"
                        >
                          Modificar
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                      Sin prescripciones registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "history" && (
        <MedicalHistoryClient 
          history={history} 
          patientName={currentPatient.full_name || "Desconocido"} 
        />
      )}

      {/* Profile Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Editar datos del paciente
                </h3>
                <p className="mt-1 text-sm text-slate-600">Actualiza solo edad y peso.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Edad</label>
                <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Peso (kg)</label>
                <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
            </div>
            {errorMessage && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancelar</Button>
              <Button type="button" onClick={handleSaveProfile} disabled={isSaving} className="gap-2 bg-sky-500 hover:bg-sky-600 text-white">
                <Save className="h-4 w-4" /> {isSaving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Edit Modal */}
      {editPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[24px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-[#1E3A8A]">
                  Modificar Prescripción
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Ajustando receta de <strong className="text-slate-800">{editPrescription.medication_name}</strong>
                </p>
              </div>
              <button
                onClick={() => setEditPrescription(null)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900">Dosis (ej. 50, 500)</label>
                  <Input type="text" value={rxDose} onChange={(e) => setRxDose(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900">Frecuencia (horas)</label>
                  <Input type="number" value={rxFrequency} onChange={(e) => setRxFrequency(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Estado de la receta</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input 
                      type="radio" 
                      name="status" 
                      checked={rxIsActive === true} 
                      onChange={() => setRxIsActive(true)}
                      className="text-sky-500"
                    />
                    <span className={rxIsActive ? "font-bold text-green-700" : "text-slate-600"}>Activo</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input 
                      type="radio" 
                      name="status" 
                      checked={rxIsActive === false} 
                      onChange={() => setRxIsActive(false)} 
                      className="text-sky-500"
                    />
                    <span className={!rxIsActive ? "font-bold text-red-700" : "text-slate-600"}>Suspendido</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Motivo de modificación <span className="text-red-500">*</span></label>
                <textarea 
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 min-h-[80px]"
                  placeholder="Ej. Ajuste de dosis por control subóptimo, o suspensión por efectos adversos..."
                  value={rxReason}
                  onChange={(e) => setRxReason(e.target.value)}
                />
              </div>
            </div>

            {rxError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 font-medium">{rxError}</p>}
            
            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={() => setEditPrescription(null)} disabled={rxSaving}>Cancelar</Button>
              <Button type="button" onClick={handleSavePrescription} disabled={rxSaving} className="gap-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl">
                {rxSaving ? "Registrando cambio..." : "Registrar modificación"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
