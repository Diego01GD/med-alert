"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type AssignedPatient = {
  id: string;
  full_name: string | null;
  age: number | null;
  weight: number | null;
};

interface DoctorPatientsListProps {
  patients: AssignedPatient[];
}

function formatNullableValue(value: number | null) {
  return value === null || value === undefined ? "-" : value.toString();
}

export function DoctorPatientsList({ patients }: DoctorPatientsListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filtrar pacientes por nombre
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;

    return patients.filter((patient) =>
      (patient.full_name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim())
    );
  }, [patients, searchQuery]);

  return (
    <div className="flex-1 bg-[#94A4B4] border border-slate-600 rounded-lg overflow-hidden flex flex-col min-h-[400px]">
      {/* Buscador */}
      <div className="bg-slate-700 p-4 border-b border-slate-600/40">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar paciente por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-600 border-slate-500 text-white placeholder:text-slate-400 font-semibold rounded-lg"
          />
        </div>
      </div>

      {/* Encabezado de la tabla */}
      <div className="grid grid-cols-3 bg-slate-800 text-white p-6 font-bold uppercase tracking-wider text-xl">
        <div className="px-4">Nombre del paciente</div>
        <div className="px-4 text-center">Edad</div>
        <div className="px-4 text-center">Peso</div>
      </div>

      {/* Contenido de la tabla */}
      <div className="flex-1 overflow-auto">
        {filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => (
            <Link
              key={patient.id}
              href={`/protected/doctor/prescriptions?patientId=${patient.id}`}
              className="grid grid-cols-3 items-center border-t border-slate-600/40 p-6 text-slate-900 transition hover:bg-slate-700/10"
            >
              <div className="px-4">
                <p className="font-bold text-lg">
                  {patient.full_name ?? "Paciente sin nombre"}
                </p>
              </div>
              <div className="px-4 text-center text-lg font-bold">
                {formatNullableValue(patient.age)}
              </div>
              <div className="px-4 text-center text-lg font-bold">
                {formatNullableValue(patient.weight)}
              </div>
            </Link>
          ))
        ) : (
          <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center p-20">
            {patients.length === 0 ? (
              <>
                <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none opacity-50">
                  Aún no hay pacientes asignados
                </h3>
                <p className="mt-4 max-w-2xl text-lg font-medium text-slate-700">
                  Cuando se creen relaciones en{" "}
                  <span className="font-bold">user_relations</span> con tipo{" "}
                  <span className="font-bold">medico-paciente</span>, los
                  pacientes aparecerán aquí.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none opacity-50">
                  No se encontraron pacientes
                </h3>
                <p className="mt-4 max-w-2xl text-lg font-medium text-slate-700">
                  No hay pacientes que coincidan con "{searchQuery}"
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
