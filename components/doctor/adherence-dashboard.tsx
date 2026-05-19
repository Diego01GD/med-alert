"use client";

import { useState, useMemo } from "react";
import { Calendar, DownloadCloud } from "lucide-react";
import { AdherenceMetricsCards } from "./adherence-metrics-cards";
import { PatientAdherenceChart } from "./patient-adherence-chart";
import { DoseBreakdownChart } from "./dose-breakdown-chart";
import { AdheranceDetailTable } from "./adherance-detail-table";

export interface IntakeLog {
  id: string;
  prescription_id: string;
  scheduled_time: string;
  actual_time: string | null;
  status: "cumplido" | "atrasado" | "omitido";
  omission_reason: string | null;
  observations: string | null;
}

export interface PatientData {
  id: string;
  full_name: string;
  intakeLogs: IntakeLog[];
}

export interface AdherenceDashboardProps {
  patients: PatientData[];
  timeRange?: "7days" | "30days" | "90days" | "all";
  onTimeRange?: (range: string) => void;
}

function calculateAdherence(
  logs: IntakeLog[],
  onlyFiltered: boolean = false
): { adherence: number; onTime: number; justified: number; unjustified: number } {
  if (logs.length === 0) {
    return { adherence: 0, onTime: 0, justified: 0, unjustified: 0 };
  }

  let onTimeCount = 0;
  let justifiedCount = 0;
  let unjustifiedCount = 0;
  let totalCount = 0;

  logs.forEach((log) => {
    if (log.status === "cumplido" || log.status === "atrasado") {
      onTimeCount++;
    } else if (log.status === "omitido") {
      if (log.omission_reason && log.omission_reason.trim()) {
        justifiedCount++;
      } else {
        unjustifiedCount++;
      }
    }
    totalCount++;
  });

  const adherence = totalCount > 0 ? Math.round((onTimeCount / totalCount) * 100) : 0;

  return {
    adherence,
    onTime: onTimeCount,
    justified: justifiedCount,
    unjustified: unjustifiedCount,
  };
}

function filterLogsByTimeRange(
  logs: IntakeLog[],
  timeRange: string
): IntakeLog[] {
  const now = new Date();
  let startDate = new Date();

  switch (timeRange) {
    case "7days":
      startDate.setDate(now.getDate() - 7);
      break;
    case "30days":
      startDate.setDate(now.getDate() - 30);
      break;
    case "90days":
      startDate.setDate(now.getDate() - 90);
      break;
    case "all":
    default:
      return logs;
  }

  return logs.filter(
    (log) => new Date(log.scheduled_time) >= startDate
  );
}

export function AdherenceDashboard({
  patients,
  timeRange = "7days",
  onTimeRange,
}: AdherenceDashboardProps) {
  const [selectedRange, setSelectedRange] = useState(timeRange);

  const filteredData = useMemo(() => {
    const patientsWithMetrics = patients.map((patient) => {
      const filteredLogs = filterLogsByTimeRange(patient.intakeLogs, selectedRange);
      const metrics = calculateAdherence(filteredLogs);

      return {
        patientId: patient.id,
        patientName: patient.full_name || "Paciente sin nombre",
        adherence: metrics.adherence,
        onTimePercentage: filteredLogs.length > 0 ? Math.round((metrics.onTime / filteredLogs.length) * 100) : 0,
        justifiedPercentage: filteredLogs.length > 0 ? Math.round((metrics.justified / filteredLogs.length) * 100) : 0,
        unjustifiedPercentage: filteredLogs.length > 0 ? Math.round((metrics.unjustified / filteredLogs.length) * 100) : 0,
        status: (
          metrics.adherence >= 80
            ? "Alta"
            : metrics.adherence >= 60
              ? "Media"
              : "Baja"
        ) as "Alta" | "Media" | "Baja",
        onTime: metrics.onTime,
        justified: metrics.justified,
        unjustified: metrics.unjustified,
      };
    });

    return patientsWithMetrics;
  }, [patients, selectedRange]);

  const metrics = useMemo(() => {
    const totalAdherence = filteredData.length > 0
      ? Math.round(
          filteredData.reduce((sum, p) => sum + p.adherence, 0) /
            filteredData.length
        )
      : 0;

    const lowAdherenceCount = filteredData.filter(
      (p) => p.adherence < 60
    ).length;

    const totalOnTime = filteredData.reduce((sum, p) => sum + p.onTime, 0);
    const totalJustified = filteredData.reduce((sum, p) => sum + p.justified, 0);
    const totalUnjustified = filteredData.reduce(
      (sum, p) => sum + p.unjustified,
      0
    );

    return {
      averageAdherence: totalAdherence,
      activePatients: filteredData.length,
      lowAdherencePatients: lowAdherenceCount,
      totalMissedDoses: totalJustified + totalUnjustified,
      totalOnTime,
      totalJustified,
      totalUnjustified,
    };
  }, [filteredData]);

  const handleRangeChange = (range: string) => {
    setSelectedRange(range as "7days" | "30days" | "90days" | "all");
    onTimeRange?.(range);
  };

  const handleDownloadReport = (patientId: string, patientName: string) => {
    // Placeholder for report generation
    console.log(`Downloading report for patient: ${patientName}`);
    // In a real implementation, this would generate and download a PDF or CSV file
  };

  return (
    <div className="space-y-8">
      {/* Header with title and time range selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Analítica y Reportes de Adherencia
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Visualiza el cumplimiento de tratamientos de tus pacientes y exporta
            reportes para seguimiento clínico.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleDownloadReport("", "")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <DownloadCloud size={16} />
            Exportar reporte general
          </button>

          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
            <Calendar size={16} className="text-slate-600" />
            <select
              value={selectedRange}
              onChange={(e) => handleRangeChange(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="7days">Últimos 7 días</option>
              <option value="30days">Últimos 30 días</option>
              <option value="90days">Últimos 90 días</option>
              <option value="all">Todo el período</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <AdherenceMetricsCards metrics={metrics} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PatientAdherenceChart
          data={filteredData.map((p) => ({
            patientName: p.patientName,
            adherence: p.adherence,
          }))}
        />
        <DoseBreakdownChart
          data={{
            onTime: metrics.totalOnTime,
            justified: metrics.totalJustified,
            unjustified: metrics.totalUnjustified,
          }}
        />
      </div>

      {/* Details Table */}
      <AdheranceDetailTable
        data={filteredData}
        onDownloadReport={handleDownloadReport}
      />
    </div>
  );
}
