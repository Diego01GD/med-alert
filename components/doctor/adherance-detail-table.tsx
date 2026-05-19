"use client";

import { ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";

export interface PatientAdherenceDetail {
  patientId: string;
  patientName: string;
  adherence: number;
  onTimePercentage: number;
  justifiedPercentage: number;
  unjustifiedPercentage: number;
  status: "Alta" | "Media" | "Baja";
}

export interface AdheranceDetailTableProps {
  data: PatientAdherenceDetail[];
  onDownloadReport?: (patientId: string, patientName: string) => void;
}

const getStatusColor = (
  status: "Alta" | "Media" | "Baja"
): string => {
  switch (status) {
    case "Alta":
      return "bg-green-100 text-green-800";
    case "Media":
      return "bg-amber-100 text-amber-800";
    case "Baja":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
};

export function AdheranceDetailTable({
  data,
  onDownloadReport,
}: AdheranceDetailTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "adherence">("adherence");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredData = useMemo(() => {
    return data.filter((patient) =>
      patient.patientName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    sorted.sort((a, b) => {
      let compareValue = 0;
      if (sortBy === "name") {
        compareValue = a.patientName.localeCompare(b.patientName);
      } else {
        compareValue = a.adherence - b.adherence;
      }
      return sortOrder === "asc" ? compareValue : -compareValue;
    });
    return sorted;
  }, [filteredData, sortBy, sortOrder]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage]);

  const handleSort = (column: "name" | "adherence") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Detalle por paciente
      </h3>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar paciente..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left font-semibold text-slate-900">
                Paciente
              </th>
              <th
                className="px-4 py-3 text-left font-semibold text-slate-900 cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort("adherence")}
              >
                <div className="flex items-center gap-2">
                  Adherencia (%)
                  <ChevronDown
                    size={16}
                    className={`transform transition-transform ${
                      sortBy === "adherence" && sortOrder === "asc"
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </div>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900">
                A tiempo (%)
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900">
                Justificadas (%)
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900">
                Injustificadas (%)
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900">
                Estado
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((patient) => (
                <tr
                  key={patient.patientId}
                  className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 text-slate-900 font-medium">
                    {patient.patientName}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-semibold ${
                        patient.adherence >= 80
                          ? "text-green-600"
                          : patient.adherence >= 60
                            ? "text-amber-600"
                            : "text-red-600"
                      }`}
                    >
                      {patient.adherence}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {patient.onTimePercentage}%
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {patient.justifiedPercentage}%
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {patient.unjustifiedPercentage}%
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        patient.status
                      )}`}
                    >
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        onDownloadReport?.(
                          patient.patientId,
                          patient.patientName
                        )
                      }
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Descargar reporte
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No se encontraron pacientes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-slate-600">
            Mostrando 1 a {paginatedData.length} de {sortedData.length}{" "}
            pacientes
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ←
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 border rounded ${
                  currentPage === page
                    ? "bg-blue-500 text-white border-blue-500"
                    : "border-slate-300 hover:bg-slate-50"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
