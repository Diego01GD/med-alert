"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormData = {
  role: string;
  full_name: string;
  cedula_profesional: string;
  especialidad: string;
  email: string;
  phone_number: string;
};

type FieldError = {
  field: string;
  message: string;
};

function getFieldsForRole(role: string) {
  const baseFields = ["full_name", "email", "phone_number"];

  switch (role) {
    case "medico":
      return [...baseFields, "cedula_profesional", "especialidad"];
    case "farmaceutico":
      return [...baseFields, "cedula_profesional"];
    case "cuidador":
      return baseFields;
    default:
      return baseFields;
  }
}

function getFieldLabel(field: string) {
  const labels: Record<string, string> = {
    full_name: "Nombre completo",
    cedula_profesional: "Cédula profesional",
    especialidad: "Especialidad",
    email: "Correo electrónico",
    phone_number: "Número celular",
  };
  return labels[field] || field;
}

export function AddUserForm() {
  const router = useRouter();
  const initialFormData: FormData = {
    role: "",
    full_name: "",
    cedula_profesional: "",
    especialidad: "",
    email: "",
    phone_number: "",
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const requiredFields = getFieldsForRole(formData.role);
  const allFieldsFilled =
    formData.role &&
    requiredFields.every((field) => {
      const value = formData[field as keyof FormData];
      return value && String(value).trim() !== "";
    });

  function getErrorForField(field: string) {
    return fieldErrors.find((e) => e.field === field)?.message;
  }

  function resetFormState() {
    setFormData(initialFormData);
    setFieldErrors([]);
    setErrorMessage(null);
  }

  // Limpiar mensajes y estado al montar el formulario (entrar a la vista)
  useEffect(() => {
    resetFormState();
    setErrorMessage(null);
    setSuccessMessage(null);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors([]);

    // Prepare payload
    const payload = {
      role: formData.role,
      full_name: formData.full_name,
      email: formData.email,
      phone_number: formData.phone_number,
      ...(formData.cedula_profesional && {
        cedula_profesional: formData.cedula_profesional,
      }),
      ...(formData.especialidad && { especialidad: formData.especialidad }),
    };

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setErrorMessage("Este correo electrónico ya está registrado");
        } else if (response.status === 400) {
          setErrorMessage(data.error || "Error en los datos enviados");
        } else {
          setErrorMessage(
            data.error || "Error al crear el usuario. Intenta nuevamente.",
          );
        }
        return;
      }

      if (data?.delivery) {
        console.log("[SIMULACION_ENVIO_CREDENCIALES_BROWSER]", data.delivery);
      }

      const createdName = formData.full_name;
      setSuccessMessage(
        `Usuario ${createdName} creado exitosamente. Se generó contraseña automática y se simuló el envío en terminal del proyecto y consola del navegador. Redirigiendo...`,
      );

      setTimeout(() => {
        resetFormState();
        router.replace("/protected/administrador");
      }, 2000);
    } catch (error) {
      setErrorMessage("Error de conexión. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-8">
      {/* Role Selection */}
      <div>
        <Label htmlFor="role" className="text-sm font-semibold text-slate-900">
          Selecciona el rol *
        </Label>
        <select
          id="role"
          value={formData.role}
          onChange={(e) =>
            setFormData({
              ...formData,
              role: e.target.value,
              cedula_profesional: "",
              especialidad: "",
            })
          }
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        >
          <option value="">-- Selecciona un rol --</option>
          <option value="medico">Médico</option>
          <option value="farmaceutico">Farmacéutico</option>
          <option value="cuidador">Cuidador</option>
        </select>
      </div>

      {/* Dynamic Fields */}
      {formData.role && (
        <>
          <div className="space-y-4">
            {requiredFields.map((field) => (
              <div key={field}>
                <Label
                  htmlFor={field}
                  className="text-sm font-semibold text-slate-900"
                >
                  {getFieldLabel(field)} *
                </Label>
                <Input
                  id={field}
                  type={field === "email" ? "email" : "text"}
                  placeholder={
                    field === "email" ? "ejemplo@correo.com" : undefined
                  }
                  value={formData[field as keyof FormData] || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [field]: e.target.value,
                    })
                  }
                  className={`mt-2 ${
                    getErrorForField(field)
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : ""
                  }`}
                />
                {getErrorForField(field) && (
                  <p className="mt-1 text-sm text-red-600">
                    {getErrorForField(field)}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Check className="h-4 w-4 text-emerald-600" />
              La contraseña se genera automáticamente al crear la cuenta.
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Se simula el envío por terminal con teléfono, correo y contraseña
              temporal.
            </p>
          </div>

          {/* Error Messages */}
          {errorMessage && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          {/* Success Messages */}
          {successMessage && (
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!allFieldsFilled || isLoading}
              className="gap-2 bg-sky-500 hover:bg-sky-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando usuario...
                </>
              ) : (
                "Crear usuario"
              )}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
