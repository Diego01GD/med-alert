"use client";

import { useMemo, useState } from "react";
import { Link2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type UserOption = {
  id: string;
  role: string | null;
  full_name: string | null;
};

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

type AdminRelationsSectionProps = {
  users: UserOption[];
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

export function AdminRelationsSection({
  users,
  initialRelations,
}: AdminRelationsSectionProps) {
  const [relations, setRelations] = useState(initialRelations);
  const [superiorId, setSuperiorId] = useState("");
  const [patientId, setPatientId] = useState("");
  const [relationType, setRelationType] = useState("medico-paciente");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const superiors = useMemo(
    () =>
      users.filter((user) =>
        ["medico", "cuidador", "farmaceutico"].includes(user.role ?? ""),
      ),
    [users],
  );

  const patients = useMemo(
    () => users.filter((user) => user.role === "paciente"),
    [users],
  );

  async function handleCreateRelation(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!superiorId || !patientId || !relationType) {
      setErrorMessage("Completa todos los campos para crear la relación.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/relations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          superior_id: superiorId,
          patient_id: patientId,
          relation_type: relationType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "No se pudo crear la relación.");
        return;
      }

      const refreshResponse = await fetch("/api/admin/relations");
      const refreshData = await refreshResponse.json();
      if (refreshResponse.ok) {
        setRelations(refreshData.relations ?? []);
      }

      setSuccessMessage("Relación creada correctamente.");
      setPatientId("");
    } catch (error) {
      setErrorMessage("Error de conexión al crear la relación.");
    } finally {
      setIsSaving(false);
    }
  }

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
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900">
          Módulo de Relaciones
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Gestiona asignaciones entre usuarios usando la tabla user_relations.
        </p>
      </div>

      <form
        onSubmit={handleCreateRelation}
        className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-4"
      >
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Superior
          </label>
          <select
            value={superiorId}
            onChange={(e) => setSuperiorId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="">Selecciona superior</option>
            {superiors.map((user) => (
              <option key={user.id} value={user.id}>
                {(user.full_name ?? "Sin nombre") +
                  " - " +
                  roleLabel(user.role)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Paciente
          </label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="">Selecciona paciente</option>
            {patients.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name ?? "Sin nombre"}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Tipo de relación
          </label>
          <select
            value={relationType}
            onChange={(e) => setRelationType(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="medico-paciente">medico-paciente</option>
            <option value="cuidador-paciente">cuidador-paciente</option>
            <option value="farmaceutico-paciente">farmaceutico-paciente</option>
          </select>
        </div>

        <div className="flex items-end">
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-xl bg-sky-500 text-white hover:bg-sky-600"
          >
            <Link2 className="mr-2 h-4 w-4" />
            {isSaving ? "Guardando..." : "Crear relación"}
          </Button>
        </div>
      </form>

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
                  <td className="px-4 py-3 text-slate-700">
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
                      onClick={() => handleDeleteRelation(relation.id)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      {isDeletingId === relation.id
                        ? "Eliminando..."
                        : "Eliminar"}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
