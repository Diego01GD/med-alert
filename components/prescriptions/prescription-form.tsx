"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Calculator,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface Medication {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  calculatedDose: string | null;
  riskWarning: string | null;
}

interface DrugInteraction {
  med_a_name: string;
  med_b_name: string;
  severity: "Alta" | "Media" | "Baja";
  description: string;
}

interface InteractionWarning {
  severity: "Alta" | "Media" | "Baja";
  message: string;
  description: string;
}

interface PrescriptionFormProps {
  patientId: string | null;
  patientInitialAge: number | null;
  patientInitialWeight: number | null;
}

export function PrescriptionForm({
  patientId,
  patientInitialAge,
  patientInitialWeight,
}: PrescriptionFormProps) {
  const router = useRouter();
  const [patientData, setPatientData] = useState({
    patientWeight: patientInitialWeight?.toString() ?? "",
    patientAge: patientInitialAge?.toString() ?? "",
  });

  const [medications, setMedications] = useState<Medication[]>([
    {
      id: "1",
      medicationName: "",
      dosage: "",
      frequency: "",
      calculatedDose: null,
      riskWarning: null,
    },
  ]);

  const [interactionWarnings, setInteractionWarnings] = useState<
    InteractionWarning[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const topRef = useRef<HTMLDivElement>(null);

  const addMedication = () => {
    setMedications([
      ...medications,
      {
        id: Math.random().toString(36).substr(2, 9),
        medicationName: "",
        dosage: "",
        frequency: "",
        calculatedDose: null,
        riskWarning: null,
      },
    ]);
  };

  const removeMedication = (id: string) => {
    if (medications.length > 1) {
      setMedications(medications.filter((med) => med.id !== id));
    }
  };

  const updateMedication = (
    id: string,
    field: keyof Medication,
    value: string,
  ) => {
    setMedications(
      medications.map((med) => {
        if (med.id === id) {
          return { ...med, [field]: value };
        }
        return med;
      }),
    );
  };

  // Función para consultar interacciones desde la BD
  const checkDrugInteractions = async (medicationNames: string[]) => {
    const activeMeds = medicationNames.filter((name) => name.trim() !== "");

    if (activeMeds.length < 2) {
      setInteractionWarnings([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/drug-interactions/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medications: activeMeds }),
      });

      if (!response.ok) {
        console.error("Error consultando interacciones");
        setInteractionWarnings([]);
        return;
      }

      const data = (await response.json()) as {
        interactions: DrugInteraction[];
      };
      const interactions = data.interactions ?? [];

      const warnings: InteractionWarning[] = interactions.map(
        (interaction) => ({
          severity: interaction.severity,
          message: `${interaction.med_a_name} + ${interaction.med_b_name} (${interaction.severity})`,
          description: interaction.description,
        }),
      );

      setInteractionWarnings(warnings);

      if (warnings.length > 0) {
        topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (error) {
      console.error("Error al consultar interacciones:", error);
      setInteractionWarnings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const updatedMeds = medications.map((med) => {
      if (
        patientData.patientWeight &&
        patientData.patientAge &&
        med.medicationName
      ) {
        const weight = Math.max(0, parseFloat(patientData.patientWeight));
        const age = Math.max(0, parseInt(patientData.patientAge));

        let factor = 0.5;
        if (age < 12) factor = 0.25;
        else if (age > 65) factor = 0.4;

        const dose = (weight * factor).toFixed(2);
        const calculatedDose = `${dose} mg`;

        let riskWarning = null;
        const medLower = med.medicationName.toLowerCase();
        if (medLower.includes("aspirina") && (weight < 40 || age < 16)) {
          riskWarning =
            "Atencion! Riesgo elevado: No se recomienda Aspirina en pacientes pediatricos o de bajo peso.";
        }

        return { ...med, calculatedDose, riskWarning };
      }
      return { ...med, calculatedDose: null, riskWarning: null };
    });

    if (JSON.stringify(updatedMeds) !== JSON.stringify(medications)) {
      setMedications(updatedMeds);
    }

    // Consultar interacciones desde la BD
    const medicationNames = medications.map((m) => m.medicationName);
    checkDrugInteractions(medicationNames);
  }, [patientData, medications]);

  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    if (numValue < 0) return;
    if (name === "patientAge" && numValue > 110) return;
    setPatientData({ ...patientData, [name]: value });
  };

  const handleSavePrescription = async () => {
    if (!patientId) {
      setErrorMessage("Por favor selecciona un paciente primero.");
      return;
    }

    // Validar que haya al menos un medicamento
    const validMeds = medications.filter((m) => m.medicationName.trim() !== "");
    if (validMeds.length === 0) {
      setErrorMessage("Agrega al menos un medicamento a la receta.");
      return;
    }

    // Si hay cualquier interacción detectada, bloquear completamente
    if (interactionWarnings.length > 0) {
      setErrorMessage(
        "No se puede guardar mientras haya interacciones detectadas. Por favor remueve los medicamentos conflictivos.",
      );
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      // Convertir frecuencia de texto a horas (ej: "Cada 8 horas" → 8)
      const extractHours = (frequencyText: string): number => {
        const match = frequencyText.match(/(\d+)/);
        return match ? parseInt(match[1]) : 8; // Default 8 si no encuentra número
      };

      const response = await fetch("/api/prescriptions/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          medications: validMeds.map((m) => ({
            medicationName: m.medicationName,
            calculatedDose: m.calculatedDose || "0 mg", // Ej: "35.00 mg"
            frequencyHours: extractHours(m.frequency), // Extrae horas del texto
          })),
          patientAge: patientData.patientAge
            ? parseInt(patientData.patientAge)
            : undefined,
          patientWeight: patientData.patientWeight
            ? parseFloat(patientData.patientWeight)
            : undefined,
        }),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error: string };
        setErrorMessage(error.error || "Error al guardar la receta.");
        return;
      }

      setSuccessMessage("¡Receta guardada exitosamente y perfil actualizado!");

      // Limpiar el formulario después de 2 segundos
      setTimeout(() => {
        setMedications([
          {
            id: "1",
            medicationName: "",
            dosage: "",
            frequency: "",
            calculatedDose: null,
            riskWarning: null,
          },
        ]);
        setSuccessMessage("");
      }, 2000);
    } catch (error) {
      console.error("Error al guardar la receta:", error);
      setErrorMessage("Error interno al guardar la receta.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6" ref={topRef}>
      <Card className="max-w-4xl mx-auto border-none shadow-none bg-transparent">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-900">
            Tabla de informacion de recetas y medicamentos
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Mensajes de éxito */}
          {successMessage && (
            <div className="p-4 bg-green-600 text-white rounded-xl flex items-center gap-4 border-2 border-green-800 animate-pulse">
              <CheckCircle className="h-8 w-8 shrink-0" />
              <p className="text-sm font-bold">{successMessage}</p>
            </div>
          )}

          {/* Mensajes de error */}
          {errorMessage && (
            <div className="p-4 bg-orange-600 text-white rounded-xl flex items-center gap-4 border-2 border-orange-800">
              <AlertTriangle className="h-8 w-8 shrink-0" />
              <p className="text-sm font-bold">{errorMessage}</p>
            </div>
          )}

          {/* Alertas de interacciones por severidad */}
          {interactionWarnings.length > 0 && (
            <div className="space-y-3">
              {interactionWarnings.map((warning, idx) => {
                const bgColor =
                  warning.severity === "Alta"
                    ? "bg-red-600 border-red-900"
                    : warning.severity === "Media"
                      ? "bg-yellow-600 border-yellow-900"
                      : "bg-blue-600 border-blue-900";

                return (
                  <div
                    key={idx}
                    className={`p-4 ${bgColor} text-white rounded-xl flex items-center gap-4 border-2 animate-pulse`}
                  >
                    <AlertTriangle className="h-8 w-8 shrink-0" />
                    <div>
                      <p className="font-black uppercase text-xs tracking-widest">
                        ¡ALERTA DE SEVERIDAD {warning.severity}!
                      </p>
                      <p className="text-sm font-bold">{warning.message}</p>
                      <p className="text-xs opacity-90 mt-1">
                        {warning.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-400/20 p-4 rounded-xl border border-slate-400/30">
            <div className="space-y-2">
              <Label
                htmlFor="patientWeight"
                className="text-black font-extrabold uppercase text-xs tracking-tight"
              >
                Peso del Paciente (kg)
              </Label>
              <Input
                id="patientWeight"
                name="patientWeight"
                type="number"
                placeholder="Ej. 70"
                className="bg-slate-300/50 border-slate-900 rounded-xl font-bold text-black"
                value={patientData.patientWeight}
                onChange={handlePatientChange}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="patientAge"
                className="text-black font-extrabold uppercase text-xs tracking-tight"
              >
                Edad del Paciente
              </Label>
              <Input
                id="patientAge"
                name="patientAge"
                type="number"
                placeholder="Ej. 35"
                className="bg-slate-300/50 border-slate-900 rounded-xl font-bold text-black"
                value={patientData.patientAge}
                onChange={handlePatientChange}
              />
            </div>
          </div>

          <div className="space-y-6">
            {medications.map((med, index) => (
              <div
                key={med.id}
                className="relative p-6 bg-slate-300/40 rounded-2xl border border-slate-400/50 space-y-4 shadow-sm"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-black text-black uppercase text-sm tracking-widest">
                    Medicamento #{index + 1}
                  </h3>
                  {medications.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMedication(med.id)}
                      className="text-red-700 hover:bg-red-200 h-8 w-8 border border-red-700/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-black text-xs font-black uppercase tracking-tight">
                      Nombre
                    </Label>
                    <Input
                      placeholder="Ej. Aspirina, Warfarina..."
                      className="bg-white/70 border-slate-900 rounded-xl text-black font-medium"
                      value={med.medicationName}
                      onChange={(e) =>
                        updateMedication(
                          med.id,
                          "medicationName",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-black text-xs font-black uppercase tracking-tight">
                      Frecuencia
                    </Label>
                    <Input
                      placeholder="Ej. Cada 8 horas"
                      className="bg-white/70 border-slate-900 rounded-xl text-black font-medium"
                      value={med.frequency}
                      onChange={(e) =>
                        updateMedication(med.id, "frequency", e.target.value)
                      }
                    />
                  </div>
                </div>

                {med.calculatedDose && (
                  <div className="p-4 bg-slate-900 rounded-lg flex items-center gap-3 border border-black text-white shadow-inner">
                    <Calculator className="h-5 w-5 text-sky-400" />
                    <div>
                      <p className="text-[10px] font-medium uppercase opacity-70">
                        Dosis Sugerida:
                      </p>
                      <p className="text-2xl font-black">
                        {med.calculatedDose}
                      </p>
                    </div>
                  </div>
                )}

                {med.riskWarning && (
                  <div className="p-3 bg-red-600 text-white rounded-lg flex items-center gap-2 border border-red-900 text-[11px] font-black uppercase">
                    <AlertCircle className="h-4 w-4" />
                    {med.riskWarning}
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button
            onClick={addMedication}
            variant="outline"
            className="w-full py-8 border-dashed border-2 border-slate-900 bg-white/50 text-slate-900 hover:bg-slate-900 hover:text-white rounded-2xl gap-2 font-black tracking-widest transition-all shadow-sm"
          >
            <Plus className="h-6 w-6" />
            AÑADIR OTRO MEDICAMENTO A LA RECETA
          </Button>
        </CardContent>

        <CardFooter className="flex justify-end gap-3 pt-8">
          <Button
            variant="outline"
            className="rounded-xl border-slate-900 bg-black text-white hover:bg-slate-900 px-10 font-black tracking-widest uppercase text-xs"
            disabled={isSaving}
            onClick={() => router.push("/protected/doctor")}
          >
            Cancelar
          </Button>
          <Button
            disabled={
              isSaving ||
              isLoading ||
              !patientId ||
              medications.filter((m) => m.medicationName.trim() !== "")
                .length === 0 ||
              interactionWarnings.length > 0
            }
            onClick={handleSavePrescription}
            className={`rounded-xl border-2 border-slate-900 gap-2 px-10 font-black tracking-widest uppercase text-xs shadow-xl transition-all ${
              isSaving ||
              isLoading ||
              !patientId ||
              medications.filter((m) => m.medicationName.trim() !== "")
                .length === 0 ||
              interactionWarnings.length > 0
                ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
                : "bg-white text-black hover:bg-slate-200"
            }`}
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Guardando..." : "Guardar Receta"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
