"use client";

import { Card, CardContent } from "@/components/ui/card";
import { User, Phone, Calendar, Weight } from "lucide-react";

interface PatientData {
  id: string;
  full_name: string | null;
  age: number | null;
  weight: number | null;
  phone_number: string | null;
}

interface PrescriptionPatientSectionProps {
  patient: PatientData;
}

export function PrescriptionPatientSection({
  patient,
}: PrescriptionPatientSectionProps) {
  const formatNullable = (value: number | string | null) => {
    return value === null || value === undefined ? "-" : value.toString();
  };

  return (
    <section className="bg-slate-300/50 border border-slate-400/30 rounded-lg p-6">
      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="space-y-4 p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Nombre */}
            <div className="flex items-center gap-3 bg-white/50 p-3 rounded-lg border border-slate-200">
              <User className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">
                  Paciente
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {formatNullable(patient.full_name)}
                </p>
              </div>
            </div>

            {/* Edad */}
            <div className="flex items-center gap-3 bg-white/50 p-3 rounded-lg border border-slate-200">
              <Calendar className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">
                  Edad
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {formatNullable(patient.age)}
                  {patient.age && patient.age !== null && " años"}
                </p>
              </div>
            </div>

            {/* Peso */}
            <div className="flex items-center gap-3 bg-white/50 p-3 rounded-lg border border-slate-200">
              <Weight className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">
                  Peso
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {formatNullable(patient.weight)}
                  {patient.weight && patient.weight !== null && " kg"}
                </p>
              </div>
            </div>

            {/* Teléfono */}
            <div className="flex items-center gap-3 bg-white/50 p-3 rounded-lg border border-slate-200">
              <Phone className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">
                  Teléfono
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {formatNullable(patient.phone_number)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
