import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

interface SavePrescriptionRequest {
  patientId: string;
  medications: Array<{
    medicationName: string;
    calculatedDose: string; // "X mg"
    frequencyHours: number; // Número de horas
  }>;
  patientAge?: number;
  patientWeight?: number;
}

async function assertDoctor() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, status: 401, error: "No autorizado." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "medico") {
    return { ok: false as const, status: 403, error: "Acceso restringido." };
  }

  return { ok: true as const, doctorId: user.id };
}

export async function POST(request: Request) {
  try {
    const authCheck = await assertDoctor();
    if (!authCheck.ok) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status },
      );
    }

    const body = (await request.json()) as SavePrescriptionRequest;
    const { patientId, medications, patientAge, patientWeight } = body;

    if (!patientId || !medications || medications.length === 0) {
      return NextResponse.json(
        { error: "Datos de prescripción inválidos." },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Falta la configuración del servidor." },
        { status: 500 },
      );
    }

    // Verificar que el doctor tiene relación con el paciente
    const { data: relation, error: relationError } = await adminClient
      .from("user_relations")
      .select("id")
      .eq("superior_id", authCheck.doctorId)
      .eq("patient_id", patientId)
      .maybeSingle();

    if (relationError || !relation) {
      return NextResponse.json(
        { error: "No tienes permiso para este paciente." },
        { status: 403 },
      );
    }

    // Guardar cada medicamento como una prescripción
    const prescriptionPromises = medications
      .filter((med) => med.medicationName.trim() !== "")
      .map((med) => {
        // Parsear el dosage: "X mg" → { dose: "X", unit: "mg" }
        const dosageMatch = med.calculatedDose.match(/^([\d.]+)\s*(.+)$/);
        const doseValue = dosageMatch ? dosageMatch[1] : "0";
        const doseUnit = dosageMatch ? dosageMatch[2] : "mg";

        return adminClient.from("prescriptions").insert({
          patient_id: patientId,
          doctor_id: authCheck.doctorId,
          medication_name: med.medicationName.trim(),
          dosage_info: {
            dose: doseValue,
            unit: doseUnit,
          },
          frequency_hours: med.frequencyHours,
          start_time: new Date().toISOString(),
          stock_actual: 0,
          is_active: true,
        });
      });

    const prescriptionResults = await Promise.all(prescriptionPromises);

    // Verificar si alguna inserción de prescripción falló
    for (const result of prescriptionResults) {
      if (result.error) {
        console.error("Error guardando prescripción:", result.error);
        return NextResponse.json(
          { error: "Error al guardar la prescripción." },
          { status: 500 },
        );
      }
    }

    // Actualizar perfil del paciente si se proporcionan age/weight
    if (patientAge !== undefined || patientWeight !== undefined) {
      const updateData: Record<string, number> = {};
      if (patientAge !== undefined) updateData.age = patientAge;
      if (patientWeight !== undefined) updateData.weight = patientWeight;

      const { error: updateError } = await adminClient
        .from("profiles")
        .update(updateData)
        .eq("id", patientId);

      if (updateError) {
        console.error("Error actualizando perfil del paciente:", updateError);
        // No interrumpir si falla la actualización del perfil
      }
    }

    return NextResponse.json({
      success: true,
      message: "Prescripción guardada y perfil actualizado.",
    });
  } catch (error) {
    console.error("Error en POST /api/prescriptions/save:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}
