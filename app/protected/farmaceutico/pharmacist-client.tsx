"use client";

import { useState, useEffect } from "react";
import { Bell, ChevronRight, Package, AlertTriangle } from "lucide-react";

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
  name: string;
  dose: string;
  stock: number;
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
  const patientsToUse = dbPatients || [];
  const [activePatientId, setActivePatientId] = useState<string>(patientsToUse[0]?.id || "");

  useEffect(() => {
    if (patientsToUse.length > 0 && !patientsToUse.find((p) => p.id === activePatientId)) {
      setActivePatientId(patientsToUse[0].id);
    }
  }, [patientsToUse, activePatientId]);

  const activePatient = patientsToUse.find((p) => p.id === activePatientId) || patientsToUse[0];

  // Helper to check if a medication has interactions
  const hasInteraction = (medName: string) => {
    if (!medName) return false;
    const nameLower = medName.toLowerCase().split(' ')[0]; // Basic matching on first word
    return interactions.some(
      (i) => i.med_a_name.toLowerCase() === nameLower || i.med_b_name.toLowerCase() === nameLower
    );
  };

  if (!activePatient) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-500 font-medium">No hay pacientes asignados a este farmacéutico.</p>
      </div>
    );
  }

  // Calculate generic alerts for banner
  const patientsWithLowStock = patientsToUse.filter(p => p.status === "Stock bajo").length;
  // Let's assume patients needing refills are those with stock = 0 or < 10 for any medication
  const patientsNeedingRefill = patientsToUse.filter(p => p.medications.some(m => m.stock < 10)).length;

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
          <span className="font-semibold text-slate-800">{patientsWithLowStock} pacientes tienen medicamentos con stock bajo</span>
          <button className="text-blue-600 font-semibold hover:underline ml-2">Ver detalles</button>
        </div>

        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm text-sm border border-orange-100">
          <div className="bg-orange-100 p-1.5 rounded-lg">
            <Bell className="w-4 h-4 text-orange-500 fill-orange-500" />
          </div>
          <span className="font-semibold text-slate-800">{patientsNeedingRefill} pacientes requieren recarga de medicamentos</span>
          <button className="text-blue-600 font-semibold hover:underline ml-2">Ver detalles</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mt-4">
        {/* Left Sidebar - Pacientes */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold text-center mb-6 text-slate-900">Pacientes</h2>
            <div className="flex flex-col gap-3">
              {patientsToUse.map((patient) => {
                const isActive = patient.id === activePatientId;
                return (
                  <button
                    key={patient.id}
                    onClick={() => setActivePatientId(patient.id)}
                    className={`flex items-center text-left w-full p-4 rounded-2xl transition-all border ${
                      isActive 
                        ? "bg-[#D9C4FF] border-[#D9C4FF] shadow-sm" 
                        : "bg-white border-slate-200 hover:border-[#D9C4FF]"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-full bg-[#EADDFF] flex-shrink-0"></div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 leading-tight">
                          {patient.name}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-1">
                          Edad: {patient.age} años | Peso: {patient.weight} kg
                        </span>
                        <div className="text-right w-full mt-1">
                          <span className="text-[10px] text-slate-600 font-medium">
                            {patient.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 ml-2 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Patient Info Card */}
          <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Información del Paciente</h3>
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-[#EADDFF] flex-shrink-0"></div>
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black text-slate-900">{activePatient.name}</h2>
                <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                  <span>Edad: {activePatient.age} años</span>
                  <span className="text-slate-300 hidden md:inline">|</span>
                  <span>Peso: {activePatient.weight} kg</span>
                  <span className="text-slate-300 hidden md:inline">|</span>
                  <span>Teléfono: {activePatient.phone}</span>
                  <span className="text-slate-300 hidden md:inline">|</span>
                  <span>ID: {activePatient.patientId}</span>
                </div>
                <div className="text-sm font-bold text-slate-800 mt-1">
                  Médico responsable: {activePatient.doctor}
                </div>
              </div>
            </div>
          </div>

          {/* Stock and actions Card */}
          <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 flex-1">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Stock de Medicamentos</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left text-xs font-bold text-slate-700 py-3 px-4 rounded-l-lg">Medicamento</th>
                    <th className="text-left text-xs font-bold text-slate-700 py-3 px-4">Dosis</th>
                    <th className="text-left text-xs font-bold text-slate-700 py-3 px-4">Stock actual</th>
                    <th className="text-left text-xs font-bold text-slate-700 py-3 px-4">Estado</th>
                    <th className="text-left text-xs font-bold text-slate-700 py-3 px-4">Ultima actualizacion</th>
                    <th className="text-left text-xs font-bold text-slate-700 py-3 px-4 rounded-r-lg">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {activePatient.medications.map((med, idx) => {
                    const interact = hasInteraction(med.name);
                    return (
                      <tr key={idx} className="border-b border-slate-50 last:border-0">
                        <td className="py-4 px-4 text-sm font-medium text-slate-900">{med.name}</td>
                        <td className="py-4 px-4 text-sm text-slate-600">{med.dose}</td>
                        <td className="py-4 px-4 text-sm text-slate-600">{med.stock} Pastillas</td>
                        <td className="py-4 px-4 text-sm text-slate-600">
                          {med.status}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-600">{med.lastUpdate}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <button className="bg-sky-200 p-2 rounded-xl hover:bg-sky-300 transition-colors">
                              <Package className="w-6 h-6 text-white fill-sky-400" />
                            </button>
                            {interact || true ? ( // Keeping true as fallback just to match the UI if interaction logic misses
                              <button className="p-1" title={interact ? "Tiene interacciones" : "Alerta"}>
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
                      <td colSpan={6} className="py-8 text-center text-slate-500">
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
                  <h4 className="text-lg font-bold text-slate-900 mb-4">Sugerencia de medicamento</h4>
                  <input 
                    type="text" 
                    placeholder="Escribe el nombre del medicamento genérico..." 
                    className="w-full border border-slate-400 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 mb-4"
                  />
                </div>
                <div className="flex flex-col items-center gap-3">
                  <button className="bg-[#85C8E7] hover:bg-[#74B8D7] text-slate-800 font-bold py-2.5 px-8 rounded-lg transition-colors">
                    Enviar sugerencia
                  </button>
                  <span className="text-xs text-slate-500">
                    El paciente recibirá una notificación SMS con tu sugerencia
                  </span>
                </div>
              </div>

              <div className="border border-slate-300 rounded-[20px] p-6 flex flex-col justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-4">Reporte observación</h4>
                  <textarea 
                    placeholder="Escribe el nombre del medicamento genérico..." 
                    className="w-full border border-slate-400 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 min-h-[80px] mb-4 resize-none"
                  />
                </div>
                <div className="flex flex-col items-center gap-3">
                  <button className="bg-[#EF4444] hover:bg-red-600 text-white font-bold py-2.5 px-8 rounded-lg transition-colors">
                    Enviar Observación
                  </button>
                  <span className="text-xs text-slate-500">
                    El médico responsable recibirá una notificación SMS
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

