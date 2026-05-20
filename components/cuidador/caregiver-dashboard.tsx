"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogoutButton } from "@/components/logout-button";
import {
  DownloadCloud,
  ChevronDown,
  Users,
  Info,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import HeartI from "@/public/images/Logo.svg";

export type PatientStatus = "A tiempo" | "1 - 2h atrasado" | "> 3h atrasado";

export type PatientCardProps = {
  id: string;
  name: string;
  condition: string;
  status: PatientStatus;
  initials: string;
  lastActivity: {
    state: "Tomó a tiempo" | "Tomó con retraso" | "No tomó a tiempo";
    timeStr: string;
    medication: string;
    delayStr?: string | null;
  } | null;
  nextTake: {
    timeStr: string;
    medication: string;
  } | null;
};

interface CaregiverDashboardProps {
  patients: PatientCardProps[];
}

export function CaregiverDashboard({ patients }: CaregiverDashboardProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200">
        <Link href="/" className="flex items-center gap-3">
          <Image src={HeartI} alt="MedAlert" className="w-8" />
          <span className="text-xl font-bold text-[#0F172A]">MedAlert</span>
        </Link>
        
        <LogoutButton
          className="flex items-center gap-2 text-sm font-semibold text-red-600 bg-transparent hover:bg-red-50 hover:text-red-700 shadow-none border-none px-4 py-2 rounded-lg transition-colors h-auto"
        >
          Cerrar sesión
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
        </LogoutButton>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-8 flex flex-col gap-8">
        {/* Title Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-[32px] font-bold text-[#0F172A] tracking-tight">
              Monitoreo de Adherencia
            </h1>
            <p className="text-[#64748B] text-[15px] mt-1">
              Vista consolidada del estado de cumplimiento de los tratamientos de mis pacientes asignados.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#28B4C6] text-[#28B4C6] bg-white hover:bg-[#28B4C6]/5 font-semibold text-[14px] transition-colors shadow-sm">
              <DownloadCloud size={18} />
              Exportar reporte
            </button>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[#334155] font-semibold text-[14px] hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Users size={18} className="text-[#64748B]" />
                Todos los pacientes
                <ChevronDown size={16} className="text-[#64748B] ml-1" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-10">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Mis pacientes asignados
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Legend Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
          <span className="text-[14px] font-bold text-[#334155]">Semáforo de tiempo:</span>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
              <span className="text-[14px] text-[#64748B] font-medium">A tiempo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#F59E0B]"></div>
              <span className="text-[14px] text-[#64748B] font-medium">1 - 2h atrasado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#EF4444]"></div>
              <span className="text-[14px] text-[#64748B] font-medium">&gt; 3h atrasado</span>
            </div>
          </div>
        </div>

        {/* Patients Grid */}
        {patients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map((patient) => {
              // Styling logic based on status
              const isGreen = patient.status === "A tiempo";
              const isOrange = patient.status === "1 - 2h atrasado";
              const isRed = patient.status === "> 3h atrasado";

              const borderClass = isGreen
                ? "border-[#10B981]/20 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.1)]"
                : isOrange
                ? "border-[#F59E0B]/30 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.1)]"
                : "border-[#EF4444]/20 shadow-[0_4px_20px_-4px_rgba(239,68,68,0.1)]";

              const avatarBgClass = isGreen
                ? "bg-[#D1FAE5]"
                : isOrange
                ? "bg-[#FEF3C7]"
                : "bg-[#FEE2E2]";
              
              const avatarTextClass = isGreen
                ? "text-[#059669]"
                : isOrange
                ? "text-[#D97706]"
                : "text-[#DC2626]";

              const badgeBgClass = isGreen
                ? "bg-[#D1FAE5]"
                : isOrange
                ? "bg-[#FEF3C7]"
                : "bg-[#FEE2E2]";

              const badgeTextClass = isGreen
                ? "text-[#059669]"
                : isOrange
                ? "text-[#D97706]"
                : "text-[#DC2626]";
                
              const activityIconClass = patient.lastActivity?.state === "Tomó a tiempo"
                ? "text-[#10B981]"
                : patient.lastActivity?.state === "Tomó con retraso"
                ? "text-[#F59E0B]"
                : "text-[#EF4444]";

              return (
                <div key={patient.id} className={`bg-white rounded-[24px] border ${borderClass} flex flex-col p-6 transition-all hover:-translate-y-1 hover:shadow-lg`}>
                  {/* Top Row: Avatar, Name, Status */}
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${avatarBgClass} ${avatarTextClass}`}>
                        {patient.initials}
                      </div>
                      <div>
                        <h3 className="font-bold text-[#0F172A] leading-tight">{patient.name}</h3>
                        <p className="text-[#64748B] text-sm mt-0.5">{patient.condition}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${badgeBgClass} ${badgeTextClass}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${isGreen ? "bg-[#059669]" : isOrange ? "bg-[#D97706]" : "bg-[#DC2626]"}`}></div>
                      {patient.status}
                    </div>
                  </div>

                  {/* Middle Row: Latest Activity & Next Take */}
                  <div className="flex items-stretch border-t border-[#F1F5F9] pt-6 mb-6">
                    {/* Latest Activity */}
                    <div className="flex-1 pr-4 border-r border-[#F1F5F9]">
                      <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">Última actividad</p>
                      {patient.lastActivity ? (
                        <div className="flex items-start gap-2.5">
                          {patient.lastActivity.state === "Tomó a tiempo" ? (
                            <CheckCircle2 size={18} className={`mt-0.5 ${activityIconClass}`} />
                          ) : patient.lastActivity.state === "Tomó con retraso" ? (
                            <Clock size={18} className={`mt-0.5 ${activityIconClass}`} />
                          ) : (
                            <AlertCircle size={18} className={`mt-0.5 ${activityIconClass}`} />
                          )}
                          <div className="flex flex-col gap-0.5">
                            <span className={`text-sm font-bold ${activityIconClass}`}>
                              {patient.lastActivity.state}
                            </span>
                            <span className="text-[13px] text-[#64748B] font-medium">{patient.lastActivity.timeStr}</span>
                            <span className="text-[13px] text-[#94A3B8]">{patient.lastActivity.medication}</span>
                            {patient.lastActivity.delayStr && (
                              <span className={`text-[12px] font-bold mt-1 ${activityIconClass}`}>
                                {patient.lastActivity.delayStr}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-400 font-medium">Sin registros recientes</div>
                      )}
                    </div>

                    {/* Next Take */}
                    <div className="flex-1 pl-6">
                      <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">Próxima toma</p>
                      {patient.nextTake ? (
                        <div className="flex items-start gap-2.5">
                          <Calendar size={18} className="mt-0.5 text-[#94A3B8]" />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold text-[#0F172A]">
                              {patient.nextTake.timeStr}
                            </span>
                            <span className="text-[13px] text-[#64748B] mt-0.5">{patient.nextTake.medication}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-400 font-medium">No programada</div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Link */}
                  <div className="mt-auto pt-2 flex justify-center">
                    <Link href={`/protected/cuidador/patients/${patient.id}`} className="text-[#2563EB] text-sm font-bold hover:text-[#1D4ED8] transition-colors">
                      Ver detalles &gt;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200">
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Sin pacientes asignados</h3>
            <p className="text-slate-500 max-w-md text-center">
              Actualmente no tienes pacientes asignados. Pide a un administrador que asigne pacientes a tu perfil usando la tabla de user_relations.
            </p>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-4 bg-[#EFF6FF] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
            <Info size={16} className="text-[#3B82F6]" />
          </div>
          <p className="text-sm text-[#1E40AF] font-medium">
            La información se actualiza automáticamente conforme los pacientes registran sus tomas.
          </p>
        </div>
      </main>
    </div>
  );
}
