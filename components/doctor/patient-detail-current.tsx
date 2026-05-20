"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PrescriptionPatientSection } from "./prescription-patient-section";
import { PrescriptionForm } from "@/components/prescriptions/prescription-form";
import { Plus } from "lucide-react";

interface PatientData {
  id: string;
  full_name: string | null;
  age: number | null;
  weight: number | null;
  phone_number?: string | null;
}

interface PrescriptionSummary {
  id: string;
  medication_name: string;
  dosage_info?: any;
  frequency_hours?: number | null;
  stock_actual?: number | null;
  is_active?: boolean | null;
  created_at?: string | null;
}

interface Props {
  patient: PatientData;
  prescriptions: PrescriptionSummary[];
}

export function PatientDetailCurrent({ patient, prescriptions }: Props) {
  const [openForm, setOpenForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900">Detalle rápido</h2>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setOpenForm(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" /> Añadir prescripción
          </Button>
        </div>
      </div>

      <PrescriptionPatientSection patient={patient} />

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-black mb-4">Prescripciones</h3>
        <div className="space-y-3">
          {prescriptions.length > 0 ? (
            prescriptions.map((rx) => (
              <div key={rx.id} className="p-4 border rounded-lg bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">
                      {rx.medication_name}
                    </p>
                    <p className="text-sm text-slate-600">
                      {rx.dosage_info?.dose || rx.dosage_info?.cantidad || "-"}{" "}
                      {rx.dosage_info?.unit || rx.dosage_info?.unidad || ""}
                    </p>
                  </div>
                  <div className="text-sm text-slate-500">
                    {rx.is_active ? "Activo" : "Suspendido"}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">
              Sin prescripciones registradas.
            </p>
          )}
        </div>
      </section>

      {openForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black">Nueva prescripción</h3>
              <button
                onClick={() => setOpenForm(false)}
                className="text-slate-600"
              >
                Cerrar
              </button>
            </div>
            <PrescriptionForm
              patientId={patient.id}
              patientInitialAge={patient.age}
              patientInitialWeight={patient.weight}
            />
          </div>
        </div>
      )}
    </div>
  );
}
