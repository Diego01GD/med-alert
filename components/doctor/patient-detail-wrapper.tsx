"use client";

import { useState } from "react";
import { PatientDetailClient } from "./patient-detail-client";
import { PatientDetailCurrent } from "./patient-detail-current";
import { Button } from "@/components/ui/button";

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
  history?: any[];
}

export function PatientDetailWrapper({
  patient,
  prescriptions,
  history = [],
}: Props) {
  const [mode, setMode] = useState<"anterior" | "actual">("anterior");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-3">
        <Button
          variant={mode === "anterior" ? "default" : "outline"}
          onClick={() => setMode("anterior")}
          className="capitalize"
        >
          Vista anterior
        </Button>
        <Button
          variant={mode === "actual" ? "default" : "outline"}
          onClick={() => setMode("actual")}
          className="capitalize"
        >
          Vista actual
        </Button>
      </div>

      {mode === "anterior" ? (
        <PatientDetailClient
          patient={patient}
          prescriptions={prescriptions}
          history={history}
        />
      ) : (
        <PatientDetailCurrent patient={patient} prescriptions={prescriptions} />
      )}
    </div>
  );
}
