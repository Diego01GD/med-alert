"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type RelationUser = {
  id: string;
  role: string | null;
  full_name: string | null;
};

type RelationRow = {
  id: string;
  relation_type: string;
  created_at: string;
  superior: RelationUser | null;
  patient: RelationUser | null;
};

type RelationsTableProps = {
  initialRelations: RelationRow[];
};

function formatDate(value: string | null) {
  if (!value) {
    return "No disponible";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function roleLabel(role: string | null) {
  if (!role) return "Sin rol";
  if (role === "medico") return "Médico";
  if (role === "cuidador") return "Cuidador";
  if (role === "farmaceutico") return "Farmacéutico";
  if (role === "paciente") return "Paciente";
  if (role === "admin" || role === "administrador") return "Administrador";
  return role;
}

export function RelationsTable({ initialRelations }: RelationsTableProps) {
  const [relations, setRelations] = useState(initialRelations);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RelationRow | null>(null);

  // On mount, check if a new relation was created and stored in sessionStorage
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = sessionStorage.getItem("med-alert:created-relation");
      if (!raw) return;
      const created = JSON.parse(raw) as RelationRow;
      // Prepend to list if not already present
      if (created && !relations.find((r) => r.id === created.id)) {
        setRelations((prev) => [created, ...prev]);
        setSuccessMessage("Relación añadida recientemente.");
      }
      sessionStorage.removeItem("med-alert:created-relation");
    } catch (err) {
      // ignore
    }
  }, []);

  async function handleDeleteRelation(id: string) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsDeletingId(id);

    try {
      const response = await fetch(`/api/admin/relations/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || "No se pudo eliminar la relación.");
        return;
      }

      setRelations((prev) => prev.filter((item) => item.id !== id));
      setSuccessMessage("Relación eliminada correctamente.");
    } catch (error) {
      setErrorMessage("Error de conexión al eliminar la relación.");
    } finally {
      setIsDeletingId(null);
      setPendingDelete(null);
    }
  }

  function confirmDelete(relation: RelationRow) {
    setPendingDelete(relation);
  }

  function cancelPendingDelete() {
    setPendingDelete(null);
  }

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Superior
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Paciente
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Tipo
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Creado
              </th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {relations.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-slate-500"
                  colSpan={5}
                >
                  No hay relaciones registradas.
                </td>
              </tr>
            ) : (
              relations.map((relation) => (
                <tr key={relation.id}>
                  <td className="px-4 py-3 text-slate-800">
                    {(relation.superior?.full_name ?? "Sin nombre") +
                      " (" +
                      roleLabel(relation.superior?.role ?? null) +
                      ")"}
                  </td>
                  <td className="px-4 py-3 text-slate-800">
                    {relation.patient?.full_name ?? "Sin nombre"}
                  </td>
                  <td className="px-4 py-3 text-slate-700 uppercase">
                    {relation.relation_type}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatDate(relation.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={isDeletingId === relation.id}
                      onClick={() => confirmDelete(relation)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Confirmation modal */}
      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Confirmar eliminación
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  ¿Estás seguro que quieres eliminar esta relación?
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {pendingDelete.superior?.full_name ?? "Sin nombre"} →{" "}
                  {pendingDelete.patient?.full_name ?? "Sin nombre"}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Tipo: {pendingDelete.relation_type}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={cancelPendingDelete}
                disabled={!!isDeletingId}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => handleDeleteRelation(pendingDelete.id)}
                disabled={!!isDeletingId}
              >
                {isDeletingId ? "Eliminando..." : "Eliminar relación"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
