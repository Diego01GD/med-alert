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

  const handleDownloadReport = async (patientId: string, patientName: string) => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const rangeText = {
        "7days": "Últimos 7 días",
        "30days": "Últimos 30 días",
        "90days": "Últimos 90 días",
        "all": "Todo el período"
      }[selectedRange] || selectedRange;

      if (!patientId) {
        // --- REPORTE GENERAL ---
        const doc = new jsPDF();

        // Banner azul principal
        doc.setFillColor(0, 29, 61); // #001D3D (Navy)
        doc.rect(0, 0, 210, 38, "F");

        // Texto del banner
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("MedAlert", 15, 17);

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("Reporte General de Adherencia y Cumplimiento", 15, 26);

        // Metadata a la derecha
        doc.setFontSize(9);
        doc.text(`Rango: ${rangeText}`, 155, 17);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 155, 26);

        // Título de la sección de métricas
        doc.setTextColor(0, 29, 61);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Resumen Ejecutivo de Adherencia", 15, 50);

        // Tabla de métricas generales (Summary Cards)
        autoTable(doc, {
          startY: 55,
          head: [["Adherencia Promedio", "Pacientes Activos", "Pacientes < 60% Adherencia", "Omisiones Totales"]],
          body: [[
            `${metrics.averageAdherence}%`,
            `${metrics.activePatients}`,
            `${metrics.lowAdherencePatients}`,
            `${metrics.totalMissedDoses}`
          ]],
          theme: "striped",
          headStyles: { fillColor: [0, 53, 102], textColor: 255, fontStyle: "bold" }, // #003566
          styles: { halign: "center", fontSize: 11 },
        });

        // Tabla de detalle por paciente
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Detalle General por Paciente", 15, (doc as any).lastAutoTable.finalY + 15);

        const tableBody = filteredData.map(p => [
          p.patientName,
          `${p.adherence}%`,
          `${p.onTimePercentage}%`,
          `${p.justifiedPercentage}%`,
          `${p.unjustifiedPercentage}%`,
          p.status
        ]);

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 20,
          head: [["Paciente", "Adherencia (%)", "A tiempo (%)", "Justificadas (%)", "Injustificadas (%)", "Estado"]],
          body: tableBody,
          theme: "grid",
          headStyles: { fillColor: [0, 29, 61], textColor: 255, fontStyle: "bold" },
          styles: { fontSize: 10 },
          columnStyles: {
            1: { halign: "center" },
            2: { halign: "center" },
            3: { halign: "center" },
            4: { halign: "center" },
            5: { halign: "center" },
          },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 5) {
              const val = data.cell.raw;
              if (val === 'Alta') {
                data.cell.styles.textColor = [16, 185, 129]; // Green
                data.cell.styles.fontStyle = 'bold';
              } else if (val === 'Media') {
                data.cell.styles.textColor = [245, 158, 11]; // Orange
                data.cell.styles.fontStyle = 'bold';
              } else if (val === 'Baja') {
                data.cell.styles.textColor = [239, 68, 68]; // Red
                data.cell.styles.fontStyle = 'bold';
              }
            }
          }
        });

        doc.save(`MedAlert_Reporte_General_${new Date().toISOString().split('T')[0]}.pdf`);
      } else {
        // --- REPORTE INDIVIDUAL POR PACIENTE ---
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;

        const patientMetrics = filteredData.find(p => p.patientId === patientId);
        if (!patientMetrics) return;

        const doc = new jsPDF();

        // Banner azul principal
        doc.setFillColor(0, 29, 61); // #001D3D (Navy)
        doc.rect(0, 0, 210, 38, "F");

        // Texto del banner
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("MedAlert", 15, 17);

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Reporte de Adherencia - Paciente: ${patientName}`, 15, 26);

        // Metadata a la derecha
        doc.setFontSize(9);
        doc.text(`Rango: ${rangeText}`, 155, 17);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 155, 26);

        // Título de la sección de métricas individuales
        doc.setTextColor(0, 29, 61);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Resumen de Cumplimiento del Paciente", 15, 50);

        // Tabla de métricas del paciente
        autoTable(doc, {
          startY: 55,
          head: [["Adherencia", "A tiempo", "Justificadas", "Injustificadas", "Estado"]],
          body: [[
            `${patientMetrics.adherence}%`,
            `${patientMetrics.onTimePercentage}%`,
            `${patientMetrics.justifiedPercentage}%`,
            `${patientMetrics.unjustifiedPercentage}%`,
            patientMetrics.status
          ]],
          theme: "striped",
          headStyles: { fillColor: [0, 53, 102], textColor: 255, fontStyle: "bold" }, // #003566
          styles: { halign: "center", fontSize: 11 },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 4) {
              const val = data.cell.raw;
              if (val === 'Alta') {
                data.cell.styles.textColor = [16, 185, 129];
                data.cell.styles.fontStyle = 'bold';
              } else if (val === 'Media') {
                data.cell.styles.textColor = [245, 158, 11];
                data.cell.styles.fontStyle = 'bold';
              } else if (val === 'Baja') {
                data.cell.styles.textColor = [239, 68, 68];
                data.cell.styles.fontStyle = 'bold';
              }
            }
          }
        });

        // Tabla de historial de tomas (Intake logs)
        doc.setTextColor(0, 29, 61);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Historial Detallado de Tomas", 15, (doc as any).lastAutoTable.finalY + 15);

        const filteredLogs = filterLogsByTimeRange(patient.intakeLogs, selectedRange);

        const logsBody = filteredLogs.map(log => {
          const scheduledStr = log.scheduled_time ? new Date(log.scheduled_time).toLocaleString('es-ES') : "-";
          const actualStr = log.actual_time ? new Date(log.actual_time).toLocaleString('es-ES') : "-";

          let statusText = "Omitido";
          if (log.status === "cumplido") statusText = "A tiempo";
          else if (log.status === "atrasado") statusText = "Atrasado";
          else if (log.status === "omitido") {
            statusText = log.omission_reason ? `Omitido (Justificado)` : `Omitido (Injustificado)`;
          }

          return [
            scheduledStr,
            actualStr,
            statusText,
            log.omission_reason || "-",
            log.observations || "-"
          ];
        });

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 20,
          head: [["Fecha/Hora Programada", "Fecha/Hora Realizada", "Estado", "Razón de Omisión", "Observaciones"]],
          body: logsBody,
          theme: "grid",
          headStyles: { fillColor: [0, 29, 61], textColor: 255, fontStyle: "bold" },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 38 },
            1: { cellWidth: 38 },
            2: { cellWidth: 38 },
            3: { cellWidth: 38 },
            4: { cellWidth: 'auto' }
          },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 2) {
              const val = data.cell.raw as string;
              if (val === 'A tiempo') {
                data.cell.styles.textColor = [16, 185, 129];
              } else if (val === 'Atrasado') {
                data.cell.styles.textColor = [245, 158, 11];
              } else if (val.startsWith('Omitido (Justificado)')) {
                data.cell.styles.textColor = [75, 85, 99];
              } else if (val.startsWith('Omitido (Injustificado)')) {
                data.cell.styles.textColor = [239, 68, 68];
                data.cell.styles.fontStyle = 'bold';
              }
            }
          }
        });

        const formattedName = patientName.replace(/\s+/g, "_");
        doc.save(`MedAlert_Reporte_${formattedName}_${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
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
