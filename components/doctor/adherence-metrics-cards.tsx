"use client";

import { AlertCircle, TrendingDown, Users } from "lucide-react";

export interface AdherenceMetrics {
  averageAdherence: number;
  activePatients: number;
  lowAdherencePatients: number;
  totalMissedDoses: number;
}

export interface AdherenceMetricsCardsProps {
  metrics: AdherenceMetrics;
}

export function AdherenceMetricsCards({ metrics }: AdherenceMetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Average Adherence Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-600">
            Adherencia promedio
          </h3>
          <div className="bg-green-100 rounded-full p-3">
            <svg
              className="w-6 h-6 text-green-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" opacity="0.2" />
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm3.5-9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-4xl font-bold text-slate-900">
            {metrics.averageAdherence}%
          </p>
          <p className="text-xs text-slate-500">General</p>
        </div>
      </div>

      {/* Active Patients Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-600">
            Pacientes activos
          </h3>
          <div className="bg-blue-100 rounded-full p-3">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-4xl font-bold text-slate-900">
            {metrics.activePatients}
          </p>
          <p className="text-xs text-slate-500">Pacientes</p>
        </div>
      </div>

      {/* Low Adherence Patients Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-600">
            Pacientes con baja adherencia
          </h3>
          <div className="bg-red-100 rounded-full p-3">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-4xl font-bold text-slate-900">
            {metrics.lowAdherencePatients}
          </p>
          <p className="text-xs text-slate-500">{"< 60%"}</p>
        </div>
      </div>

      {/* Total Missed Doses Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-600">
            Omisiones totales
          </h3>
          <div className="bg-orange-100 rounded-full p-3">
            <AlertCircle className="w-6 h-6 text-orange-600" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-4xl font-bold text-slate-900">
            {metrics.totalMissedDoses}
          </p>
          <p className="text-xs text-slate-500">En el período</p>
        </div>
      </div>
    </div>
  );
}
