"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, PencilLine, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  dosage_info: { cantidad?: string; unidad?: string } | null;
  frequency_hours: number | null;
  stock_actual: number | null;
  is_active: boolean | null;
  created_at: string | null;
};

type PatientDetailClientProps = {
  patient: Patient;
  prescriptions: PrescriptionHistory[];
};

function formatValue(value: number | null) {
  return value === null || value === undefined ? "-" : value.toString();
}

export function PatientDetailClient({
  patient,
  prescriptions,
}: PatientDetailClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [age, setAge] = useState<string>(patient.age?.toString() ?? "");
  const [weight, setWeight] = useState<string>(
    patient.weight?.toString() ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentPatient, setCurrentPatient] = useState(patient);

  async function handleSave() {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/protected/doctor">
          <Button
            variant="ghost"
            className="gap-2 text-slate-700 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </Link>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="gap-2 bg-sky-500 hover:bg-sky-600 text-white"
        >
          <PencilLine className="h-4 w-4" />
          Editar edad/peso
        </Button>
      </div>

      <section className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-6 md:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Nombre
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
            {formatValue(currentPatient.age)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Peso
          </p>
          <p className="mt-2 text-lg font-black text-slate-900">
            {formatValue(currentPatient.weight)}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-black text-slate-900">
            Historial de medicaciones
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Tabla reservada para revisar las medicaciones registradas del
            paciente.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Medicamento
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Dosis
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Frecuencia
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Stock
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {prescriptions.length > 0 ? (
                prescriptions.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {item.medication_name ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.dosage_info?.cantidad && item.dosage_info?.unidad
                        ? `${item.dosage_info.cantidad} ${item.dosage_info.unidad}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.frequency_hours ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.stock_actual ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.is_active ? "Activa" : "Inactiva"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-slate-500"
                    colSpan={5}
                  >
                    Sin historial de medicaciones registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Editar datos del paciente
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Actualiza solo edad y peso.
                </p>
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
                <label className="text-sm font-semibold text-slate-900">
                  Edad
                </label>
                <Input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="-"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">
                  Peso
                </label>
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="-"
                />
              </div>
            </div>

            {errorMessage ? (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {errorMessage}
              </p>
            ) : null}
            {successMessage ? (
              <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                {successMessage}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2 bg-sky-500 hover:bg-sky-600 text-white"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
