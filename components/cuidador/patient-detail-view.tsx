"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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

type CaregiverPatientDetailProps = {
  patient: Patient;
  prescriptions: PrescriptionHistory[];
};

function formatValue(value: number | null) {
  return value === null || value === undefined ? "-" : value.toString();
}

export function CaregiverPatientDetail({
  patient,
  prescriptions,
}: CaregiverPatientDetailProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/protected/cuidador">
          <Button
            variant="ghost"
            className="gap-2 text-slate-700 hover:text-slate-900 bg-white shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </Button>
        </Link>
      </div>

      <section className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-6 md:grid-cols-3 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Nombre
          </p>
          <p className="mt-2 text-lg font-black text-slate-900">
            {patient.full_name ?? "-"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Edad
          </p>
          <p className="mt-2 text-lg font-black text-slate-900">
            {formatValue(patient.age)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Peso
          </p>
          <p className="mt-2 text-lg font-black text-slate-900">
            {formatValue(patient.weight)}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-2xl font-black text-slate-900">
            Tratamientos activos
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Listado de medicaciones recetadas para este paciente.
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
                  Frecuencia (h)
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
                        : item.dosage_info?.dose && item.dosage_info?.unit
                        ? `${item.dosage_info.dose} ${item.dosage_info.unit}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.frequency_hours ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                        {item.is_active ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-slate-500"
                    colSpan={4}
                  >
                    Sin historial de medicaciones registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
