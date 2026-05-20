"use client";

import React, { useState } from "react";
import { DownloadCloud, Calendar as CalendarIcon, ChevronDown, ChevronUp, User, FileText } from "lucide-react";

type PrescriptionChange = {
  id: string;
  prescription_id: string;
  patient_id: string;
  doctor_id: string;
  medication_name: string;
  change_type: string;
  previous_state: any;
  new_state: any;
  reason: string;
  created_at: string;
  doctor?: { full_name: string };
};

interface MedicalHistoryClientProps {
  history: PrescriptionChange[];
  patientName: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.toLocaleDateString("es-MX", { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}`;
}

export function MedicalHistoryClient({ history, patientName }: MedicalHistoryClientProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedRows(newSet);
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Registro cronológico de modificaciones médicas</h2>
          <p className="text-[#64748B] text-sm mt-1">Consulta el historial completo y detallado de los cambios realizados en las recetas de tus pacientes.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#28B4C6] text-[#28B4C6] bg-white hover:bg-[#28B4C6]/5 font-semibold text-sm transition-colors">
            <DownloadCloud size={16} />
            Exportar historial
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-semibold text-sm transition-colors">
            <CalendarIcon size={16} />
            Filtrar por fecha
            <ChevronDown size={14} className="ml-1" />
          </button>
        </div>
      </div>

      {/* Patient Selector (Disabled / Informational since we are inside a patient context) */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Paciente</label>
        <div className="inline-flex items-center justify-between w-64 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium">
          {patientName}
          <ChevronDown size={16} className="text-slate-400" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha del cambio <ChevronDown size={12} className="inline ml-1" /></th>
              <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Medicamento</th>
              <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado anterior → Nuevo</th>
              <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Motivo</th>
              <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Realizado por</th>
              <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {history.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No hay modificaciones registradas para este paciente.
                </td>
              </tr>
            ) : (
              history.map((record) => {
                const isExpanded = expandedRows.has(record.id);
                const prevStateStr = record.previous_state?.is_active ? "Activo" : "Suspendido";
                const newStateStr = record.new_state?.is_active ? "Activo" : "Suspendido";
                const isPrevActive = record.previous_state?.is_active;
                const isNewActive = record.new_state?.is_active;

                return (
                  <React.Fragment key={record.id}>
                    {/* Main Row */}
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 text-sm text-slate-700 whitespace-nowrap">{formatDate(record.created_at)}</td>
                      <td className="py-4 px-4 text-sm font-semibold text-slate-900">{record.medication_name}</td>
                      <td className="py-4 px-4 text-sm flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isPrevActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                          {prevStateStr}
                        </span>
                        <span className="text-slate-400">→</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isNewActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                          {newStateStr}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600 max-w-[200px] truncate">{record.reason}</td>
                      <td className="py-4 px-4 text-sm text-slate-600">{record.doctor?.full_name || "Dr. Desconocido"}</td>
                      <td className="py-4 px-4 text-center">
                        <button 
                          onClick={() => toggleRow(record.id)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Row Details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="p-0 border-b border-slate-100">
                          <div className="bg-[#F8FAFC] p-6 m-4 rounded-2xl border border-slate-200 flex flex-col lg:flex-row gap-6">
                            
                            {/* Left Side: General Info */}
                            <div className="flex-1 space-y-4">
                              <h4 className="text-sm font-bold text-[#1E3A8A]">Detalles de la modificación</h4>
                              
                              <div className="flex items-start gap-3">
                                <CalendarIcon size={18} className="text-slate-400 mt-0.5" />
                                <div>
                                  <p className="text-xs text-slate-500 font-medium">Fecha y hora</p>
                                  <p className="text-sm text-slate-800">{formatDate(record.created_at)}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-3">
                                <User size={18} className="text-slate-400 mt-0.5" />
                                <div>
                                  <p className="text-xs text-slate-500 font-medium">Realizado por</p>
                                  <p className="text-sm text-slate-800">{record.doctor?.full_name}</p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <FileText size={18} className="text-slate-400 mt-0.5" />
                                <div>
                                  <p className="text-xs text-slate-500 font-medium">Motivo del cambio</p>
                                  <p className="text-sm text-slate-800 leading-relaxed">{record.reason}</p>
                                </div>
                              </div>
                            </div>

                            {/* Middle: Previous State */}
                            <div className={`flex-1 p-5 rounded-xl border ${isPrevActive ? "bg-green-50/50 border-green-100" : "bg-red-50/50 border-red-100"}`}>
                              <h4 className={`text-sm font-bold mb-4 ${isPrevActive ? "text-green-700" : "text-red-700"}`}>
                                Estado anterior ({prevStateStr})
                              </h4>
                              <div className="grid grid-cols-[100px_1fr] gap-y-3 text-sm">
                                <span className="text-slate-500">Dosis:</span>
                                <span className="text-slate-800 font-medium">
                                  {record.previous_state?.dosage_info?.dose} {record.previous_state?.dosage_info?.unit}
                                </span>
                                
                                <span className="text-slate-500">Frecuencia:</span>
                                <span className="text-slate-800 font-medium">
                                  Cada {record.previous_state?.frequency_hours} hrs
                                </span>
                              </div>
                            </div>

                            {/* Right: New State */}
                            <div className={`flex-1 p-5 rounded-xl border ${isNewActive ? "bg-green-50/50 border-green-100" : "bg-red-50/50 border-red-100"}`}>
                              <h4 className={`text-sm font-bold mb-4 ${isNewActive ? "text-green-700" : "text-red-700"}`}>
                                Estado nuevo ({newStateStr})
                              </h4>
                              <div className="grid grid-cols-[100px_1fr] gap-y-3 text-sm">
                                <span className="text-slate-500">Dosis:</span>
                                <span className="text-slate-800 font-medium">
                                  {record.new_state?.dosage_info?.dose} {record.new_state?.dosage_info?.unit}
                                </span>
                                
                                <span className="text-slate-500">Frecuencia:</span>
                                <span className="text-slate-800 font-medium">
                                  Cada {record.new_state?.frequency_hours} hrs
                                </span>
                              </div>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Alert */}
      <div className="mt-8 bg-[#EFF6FF] rounded-xl p-4 flex items-center gap-3 border border-blue-100">
        <div className="w-6 h-6 rounded-full border-2 border-[#3B82F6] flex items-center justify-center shrink-0 text-[#3B82F6] text-xs font-bold">i</div>
        <p className="text-sm text-slate-600">
          Este registro es confidencial y exclusivo para uso clínico. Todos los cambios realizados quedan guardados de forma segura.
        </p>
      </div>

    </div>
  );
}
