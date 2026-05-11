"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Calculator, Save, Plus, Trash2, AlertTriangle } from "lucide-react";

interface Medication {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  calculatedDose: string | null;
  riskWarning: string | null;
}

const RISKY_COMBINATIONS = [
  { pair: ["aspirina", "warfarina"], message: "Riesgo extremo de hemorragia: La Aspirina potencia el efecto anticoagulante de la Warfarina." },
  { pair: ["ibuprofeno", "aspirina"], message: "Riesgo de interaccion: El Ibuprofeno puede reducir el efecto cardioprotector de la Aspirina." },
  { pair: ["alcohol", "paracetamol"], message: "Riesgo de toxicidad hepatica severa." },
  { pair: ["sildenafil", "nitroglicerina"], message: "Peligro: Caida fatal de la presion arterial." }
];

export function PrescriptionForm() {
  const [patientData, setPatientData] = useState({
    patientWeight: "",
    patientAge: "",
  });

  const [medications, setMedications] = useState<Medication[]>([
    { id: "1", medicationName: "", dosage: "", frequency: "", calculatedDose: null, riskWarning: null }
  ]);

  const [interactionWarnings, setInteractionWarnings] = useState<string[]>([]);
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
        riskWarning: null 
      }
    ]);
  };

  const removeMedication = (id: string) => {
    if (medications.length > 1) {
      setMedications(medications.filter(med => med.id !== id));
    }
  };

  const updateMedication = (id: string, field: keyof Medication, value: string) => {
    setMedications(medications.map(med => {
      if (med.id === id) {
        return { ...med, [field]: value };
      }
      return med;
    }));
  };

  useEffect(() => {
    const updatedMeds = medications.map(med => {
      if (patientData.patientWeight && patientData.patientAge && med.medicationName) {
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
          riskWarning = "Atencion! Riesgo elevado: No se recomienda Aspirina en pacientes pediatricos o de bajo peso.";
        }

        return { ...med, calculatedDose, riskWarning };
      }
      return { ...med, calculatedDose: null, riskWarning: null };
    });

    if (JSON.stringify(updatedMeds) !== JSON.stringify(medications)) {
      setMedications(updatedMeds);
    }

    const activeMeds = medications
      .map(m => m.medicationName.toLowerCase().trim())
      .filter(name => name !== "");

    const warnings: string[] = [];
    RISKY_COMBINATIONS.forEach(combo => {
      const hasCombo = combo.pair.every(drug => activeMeds.some(m => m.includes(drug)));
      if (hasCombo) {
        warnings.push(combo.message);
      }
    });

    if (warnings.length > interactionWarnings.length) {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setInteractionWarnings(warnings);

  }, [patientData, medications.map(m => m.medicationName).join(",")]);

  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    if (numValue < 0) return;
    if (name === "patientAge" && numValue > 110) return;
    setPatientData({ ...patientData, [name]: value });
  };

  return (
    <div className="space-y-6" ref={topRef}>
      <Card className="max-w-4xl mx-auto border-none shadow-none bg-transparent">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-900">Tabla de informacion de recetas y medicamentos</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {interactionWarnings.length > 0 && (
            <div className="space-y-3">
              {interactionWarnings.map((warning, idx) => (
                <div key={idx} className="p-4 bg-red-600 text-white rounded-xl flex items-center gap-4 border-2 border-red-900 animate-pulse">
                  <AlertTriangle className="h-8 w-8 shrink-0" />
                  <div>
                    <p className="font-black uppercase text-xs tracking-widest">¡ALERTA DE SEGURIDAD CRITICA!</p>
                    <p className="text-sm font-bold">{warning}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-400/20 p-4 rounded-xl border border-slate-400/30">
            <div className="space-y-2">
              <Label htmlFor="patientWeight" className="text-black font-extrabold uppercase text-xs tracking-tight">Peso del Paciente (kg)</Label>
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
              <Label htmlFor="patientAge" className="text-black font-extrabold uppercase text-xs tracking-tight">Edad del Paciente</Label>
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
              <div key={med.id} className="relative p-6 bg-slate-300/40 rounded-2xl border border-slate-400/50 space-y-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-black text-black uppercase text-sm tracking-widest">Medicamento #{index + 1}</h3>
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
                    <Label className="text-black text-xs font-black uppercase tracking-tight">Nombre</Label>
                    <Input 
                      placeholder="Ej. Aspirina, Warfarina..." 
                      className="bg-white/70 border-slate-900 rounded-xl text-black font-medium"
                      value={med.medicationName}
                      onChange={(e) => updateMedication(med.id, "medicationName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-black text-xs font-black uppercase tracking-tight">Frecuencia</Label>
                    <Input 
                      placeholder="Ej. Cada 8 horas" 
                      className="bg-white/70 border-slate-900 rounded-xl text-black font-medium"
                      value={med.frequency}
                      onChange={(e) => updateMedication(med.id, "frequency", e.target.value)}
                    />
                  </div>
                </div>

                {med.calculatedDose && (
                  <div className="p-4 bg-slate-900 rounded-lg flex items-center gap-3 border border-black text-white shadow-inner">
                    <Calculator className="h-5 w-5 text-sky-400" />
                    <div>
                      <p className="text-[10px] font-medium uppercase opacity-70">Dosis Sugerida:</p>
                      <p className="text-2xl font-black">{med.calculatedDose}</p>
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
          <Button variant="outline" className="rounded-xl border-slate-900 bg-black text-white hover:bg-slate-900 px-10 font-black tracking-widest uppercase text-xs">
            Cancelar
          </Button>
          <Button 
            disabled={interactionWarnings.length > 0}
            className={`rounded-xl border-2 border-slate-900 gap-2 px-10 font-black tracking-widest uppercase text-xs shadow-xl transition-all ${
              interactionWarnings.length > 0 
                ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed" 
                : "bg-white text-black hover:bg-slate-200"
            }`}
          >
            <Save className="h-4 w-4" />
            Guardar Receta
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}