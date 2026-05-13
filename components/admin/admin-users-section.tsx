"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminUserRow = {
  id: string;
  role: string | null;
  full_name: string | null;
  phone_number: string | null;
  email: string | null;
  created_at: string | null;
};

type AdminUsersSectionProps = {
  initialUsers: AdminUserRow[];
};

function formatRoleLabel(role: string | null) {
  switch (role) {
    case "medico":
      return "medico";
    case "cuidador":
      return "cuidador";
    case "farmaceutico":
      return "farmaceutico";
    case "admin":
    case "administrador":
      return "Administrador";
    default:
      return "Sin rol";
  }
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

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

function isAdminRole(role: string | null) {
  return role === "admin" || role === "administrador";
}

function normalize(value: string | null) {
  return (value ?? "").toLowerCase().trim();
}

export function AdminUsersSection({ initialUsers }: AdminUsersSectionProps) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [deletingUser, setDeletingUser] = useState<AdminUserRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const nonPatientUsers = users.filter((user) => user.role !== "paciente");
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
      return nonPatientUsers;
    }

    return nonPatientUsers.filter((user) => {
      const inName = normalize(user.full_name).includes(normalizedQuery);
      const inEmail = normalize(user.email).includes(normalizedQuery);
      const inPhone = normalize(user.phone_number).includes(normalizedQuery);
      return inName || inEmail || inPhone;
    });
  }, [users, query]);

  async function handleConfirmDelete() {
    if (!deletingUser || isAdminRole(deletingUser.role)) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "No se pudo eliminar la cuenta.");
      }

      setUsers((currentUsers) =>
        currentUsers.filter((user) => user.id !== deletingUser.id),
      );
      setDeletingUser(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la cuenta.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Link href="/protected/administrador/new">
          <Button className="w-fit rounded-xl bg-sky-300 text-slate-900 shadow-sm hover:bg-sky-400">
            <Plus className="mr-2 h-4 w-4" />
            Añadir nuevo usuario
          </Button>
        </Link>
        <h2 className="text-center text-xl font-black text-slate-900 md:flex-1">
          Sección de Usuarios
        </h2>
        <div className="w-full md:w-72">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, correo o telefono"
              className="h-10 rounded-xl border-slate-300 bg-white pl-9"
            />
          </div>
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200 bg-white/80">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-5 py-4">ID</th>
                <th className="px-5 py-4">Nombre</th>
                <th className="px-5 py-4">Correo electronico</th>
                <th className="px-5 py-4">Telefono</th>
                <th className="px-5 py-4">Rol</th>
                <th className="px-5 py-4">Fecha de registro</th>
                <th className="px-5 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const userIsAdmin = isAdminRole(user.role);
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-600">
                        {shortId(user.id)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {user.full_name ?? "Sin nombre"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {user.email ?? "No disponible"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {user.phone_number ?? "No registrado"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-700 uppercase">
                        {formatRoleLabel(user.role)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-center gap-3 text-xs font-semibold text-slate-400">
                          <Button
                            onClick={() => setDeletingUser(user)}
                            disabled={userIsAdmin || isDeleting}
                            title={
                              userIsAdmin
                                ? "No se puede borrar un administrador"
                                : "Eliminar cuenta"
                            }
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 rounded-full border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm font-semibold text-slate-500"
                  >
                    No hay usuarios para mostrar con el filtro actual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deletingUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Confirmar eliminación
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  ¿Estas seguro que deseas eliminar esta cuenta?
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {deletingUser.full_name ?? "Sin nombre"} (
                  {deletingUser.email ?? "No disponible"})
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Esta acción no se puede deshacer y se eliminarán todos los
                  datos asociados.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingUser(null)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting || isAdminRole(deletingUser.role)}
              >
                {isDeleting ? "Eliminando..." : "Eliminar cuenta"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
