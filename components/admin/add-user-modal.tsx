"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateSecurePassword } from "@/lib/utils/password-generator";

type AddUserRole = "medico" | "farmaceutico" | "cuidador";

type AddUserFormData = {
  role: AddUserRole | "";
  full_name: string;
  cedula_profesional: string;
  especialidad: string;
  email: string;
  phone_number: string;
  password: string;
};

type AddUserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
};

function getFieldsForRole(role: AddUserRole | ""): string[] {
  switch (role) {
    case "medico":
      return [
        "full_name",
        "cedula_profesional",
        "especialidad",
        "email",
        "phone_number",
      ];
    case "farmaceutico":
      return ["full_name", "cedula_profesional", "email", "phone_number"];
    case "cuidador":
      return ["full_name", "email", "phone_number"];
    default:
      return [];
  }
}

function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    full_name: "Nombre completo",
    cedula_profesional: "Cédula profesional",
    especialidad: "Especialidad",
    email: "Correo electrónico",
    phone_number: "Número celular",
    password: "Contraseña",
  };
  return labels[field] || field;
}

export function AddUserModal({
  isOpen,
  onClose,
  onUserAdded,
}: AddUserModalProps) {
  const [formData, setFormData] = useState<AddUserFormData>({
    role: "",
    full_name: "",
    cedula_profesional: "",
    especialidad: "",
    email: "",
    phone_number: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const requiredFields = getFieldsForRole(formData.role as AddUserRole);
  const allFieldsFilled = requiredFields.every((field) => {
    const value = formData[field as keyof AddUserFormData];
    return value && String(value).trim().length > 0;
  });

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        role: "",
        full_name: "",
        cedula_profesional: "",
        especialidad: "",
        email: "",
        phone_number: "",
        password: "",
      });
      setErrorMessage(null);
      setSuccessMessage(null);
      setShowPassword(false);
    }
  }, [isOpen]);

  function handleGeneratePassword() {
    const newPassword = generateSecurePassword();
    setFormData((prev) => ({ ...prev, password: newPassword }));
  }

  function handleRoleChange(role: AddUserRole | "") {
    setFormData((prev) => ({
      ...prev,
      role,
      cedula_profesional: "",
      especialidad: "",
      full_name: "",
      email: "",
      phone_number: "",
    }));
    setErrorMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allFieldsFilled || !formData.password || !formData.role) {
      setErrorMessage(
        "Por favor completa todos los campos y genera una contraseña.",
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = {
        role: formData.role,
        full_name: formData.full_name,
        cedula_profesional: formData.cedula_profesional || null,
        especialidad: formData.especialidad || null,
        email: formData.email,
        phone_number: formData.phone_number,
        password: formData.password,
      };

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "No se pudo crear la cuenta.");
      }

      setSuccessMessage(
        "Usuario creado exitosamente. La contraseña fue enviada por SMS.",
      );
      setTimeout(() => {
        onUserAdded();
        onClose();
      }, 2000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Error al crear la cuenta.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900">
            Añadir nuevo usuario
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Select */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              ¿Qué rol deseas añadir?
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                handleRoleChange(e.target.value as AddUserRole | "")
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">-- Selecciona un rol --</option>
              <option value="medico">Médico</option>
              <option value="farmaceutico">Farmacéutico</option>
              <option value="cuidador">Cuidador</option>
            </select>
          </div>

          {/* Dynamic Fields */}
          {formData.role && (
            <div className="space-y-4 rounded-xl bg-slate-50 p-4">
              {requiredFields.map((field) => {
                if (field === "password") return null;
                return (
                  <div key={field}>
                    <label className="block text-sm font-semibold text-slate-900 mb-1">
                      {getFieldLabel(field)}
                    </label>
                    <Input
                      type={field === "email" ? "email" : "text"}
                      value={formData[field as keyof AddUserFormData] || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [field]: e.target.value,
                        }))
                      }
                      placeholder={getFieldLabel(field)}
                      className="rounded-xl border-slate-300 bg-white"
                      required
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Password Section */}
          {formData.role && (
            <div className="space-y-2 rounded-xl bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-900">
                  Contraseña (generada automáticamente)
                </label>
                <Button
                  type="button"
                  onClick={handleGeneratePassword}
                  disabled={isLoading}
                  className="rounded-lg bg-sky-500 text-white hover:bg-sky-600"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Generar
                </Button>
              </div>
              {formData.password && (
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    readOnly
                    className="rounded-xl border-sky-300 bg-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )}
              <p className="text-xs text-slate-600">
                8-12 caracteres con mín. 1 número, 1 mayúscula y 1 carácter
                especial
              </p>
            </div>
          )}

          {/* Messages */}
          {errorMessage && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {errorMessage}
            </p>
          )}
          {successMessage && (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {successMessage}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!allFieldsFilled || !formData.password || isLoading}
              className="rounded-xl bg-sky-500 text-white hover:bg-sky-600"
            >
              {isLoading ? "Creando..." : "Crear usuario"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
