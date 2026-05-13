import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface DrugInteractionRequest {
  medications: string[];
}

interface DrugInteraction {
  med_a_name: string;
  med_b_name: string;
  severity: "Alta" | "Media" | "Baja";
  description: string;
}

export async function POST(request: Request) {
  try {
    const { medications } = (await request.json()) as DrugInteractionRequest;

    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return NextResponse.json(
        { error: "Medicamentos no válidos", interactions: [] },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Falta la configuración del servidor." },
        { status: 500 }
      );
    }

    // Normalizar nombres de medicamentos (minúsculas, sin espacios extras)
    const normalizedMeds = medications
      .map((m) => m.toLowerCase().trim())
      .filter((m) => m !== "");

    if (normalizedMeds.length === 0) {
      return NextResponse.json({ interactions: [] });
    }

    // Consultar la tabla drug_interactions
    const { data: allInteractions, error } = await adminClient
      .from("drug_interactions")
      .select("med_a_name, med_b_name, severity, description");

    if (error) {
      console.error("Error consultando drug_interactions:", error);
      return NextResponse.json(
        { error: "No se pudo consultar interacciones." },
        { status: 500 }
      );
    }

    // Filtrar interacciones que aplican a los medicamentos ingresados
    const relevantInteractions: DrugInteraction[] = [];
    const interactions = (allInteractions ?? []) as DrugInteraction[];

    interactions.forEach((interaction) => {
      const medA = interaction.med_a_name.toLowerCase().trim();
      const medB = interaction.med_b_name.toLowerCase().trim();

      // Verificar si ambos medicamentos están en la lista de medicamentos ingresados
      const hasA = normalizedMeds.some(
        (med) => med.includes(medA) || medA.includes(med)
      );
      const hasB = normalizedMeds.some(
        (med) => med.includes(medB) || medB.includes(med)
      );

      if (hasA && hasB && normalizedMeds.length >= 2) {
        relevantInteractions.push(interaction);
      }
    });

    return NextResponse.json({ interactions: relevantInteractions });
  } catch (error) {
    console.error("Error en /api/drug-interactions/check:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
