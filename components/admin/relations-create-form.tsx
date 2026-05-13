"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type UserOption = {
  id: string;
  role: string | null;
  full_name: string | null;
};

type RelationsCreateFormProps = {
  users: UserOption[];
};

function roleLabel(role: string | null) {
  if (!role) return "Sin rol";
  if (role === "medico") return "Médico";
  if (role === "cuidador") return "Cuidador";
  if (role === "farmaceutico") return "Farmacéutico";
  if (role === "paciente") return "Paciente";
  if (role === "admin" || role === "administrador") return "Administrador";
  return role;
}

export function RelationsCreateForm({ users }: RelationsCreateFormProps) {
  const [superiorId, setSuperiorId] = useState("");
  const [patientId, setPatientId] = useState("");
  const [relationType, setRelationType] = useState("medico-paciente");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

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

      // Guardar relation creada en sessionStorage para que el dashboard la recoja
      try {
        const created = data.relation ?? data;
        if (typeof window !== "undefined" && created) {
          sessionStorage.setItem(
            "med-alert:created-relation",
            JSON.stringify(created),
          );
        }
      } catch {
        // ignore sessionStorage errors
      }

      setSuccessMessage("Relación creada correctamente.");
      // limpiar formulario
      setPatientId("");
      setSuperiorId("");
      setRelationType("medico-paciente");

      // redirigir al panel admin
      router.push("/protected/administrador");
      return;
    } catch (err) {
      console.error("Error creando relación:", err);
      setErrorMessage("Error de conexión al crear la relación.");
    } finally {
      setIsSaving(false);
    }
  }

  // Auto ajustar tipo de relación según rol del superior seleccionado
  useEffect(() => {
    if (!superiorId) return;
    const sup = superiors.find((u) => u.id === superiorId);
    const role = sup?.role ?? "";
    switch (role) {
      case "medico":
        setRelationType("medico-paciente");
        break;
      case "farmaceutico":
        setRelationType("farmaceutico-paciente");
        break;
      case "cuidador":
        setRelationType("cuidador-paciente");
        break;
      default:
        setRelationType("medico-paciente");
    }
  }, [superiorId, superiors]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Crear relación</h2>
        <p className="mt-1 text-sm text-slate-600">
          Esta vista solo se usa para añadir nuevas relaciones.
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
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 uppercase"
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
    </div>
  );
}
