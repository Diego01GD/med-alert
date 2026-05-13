import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type CreateIntakeLogPayload = {
  prescriptionId: string;
  scheduledTime: string;
  actualTime: string | null;
  status: "cumplido" | "atrasado" | "omitido";
  omissionReason?: string | null;
  sideEffects?: string | null;
  observations?: string | null;
};

async function assertPatient() {
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

  if (profileError || !profile || profile.role !== "paciente") {
    return { ok: false as const, status: 403, error: "Acceso restringido." };
  }

  return { ok: true as const, patientId: user.id };
}

export async function POST(request: Request) {
  try {
    const authCheck = await assertPatient();
    if (!authCheck.ok) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status },
      );
    }

    const body = (await request.json()) as CreateIntakeLogPayload;

    if (!body.prescriptionId || !body.scheduledTime || !body.status) {
      return NextResponse.json(
        { error: "Datos inválidos para registrar la toma." },
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

    const { data: prescription, error: prescriptionError } = await adminClient
      .from("prescriptions")
      .select("id, patient_id")
      .eq("id", body.prescriptionId)
      .eq("patient_id", authCheck.patientId)
      .maybeSingle();

    if (prescriptionError) {
      return NextResponse.json(
        { error: "No se pudo validar la prescripción." },
        { status: 500 },
      );
    }

    if (!prescription) {
      return NextResponse.json(
        { error: "La prescripción no pertenece al paciente autenticado." },
        { status: 403 },
      );
    }

    const { data: createdRecord, error: insertError } = await adminClient
      .from("intake_logs")
      .insert({
        patient_id: authCheck.patientId,
        prescription_id: body.prescriptionId,
        scheduled_time: body.scheduledTime,
        actual_time: body.actualTime,
        status: body.status,
        omission_reason: body.omissionReason ?? null,
        side_effects: body.sideEffects ?? null,
        observations: body.observations ?? null,
      })
      .select(
        "id, prescription_id, patient_id, scheduled_time, actual_time, status, omission_reason, side_effects, observations, created_at",
      )
      .maybeSingle();

    if (insertError || !createdRecord) {
      console.error("Error guardando intake_logs:", insertError);
      return NextResponse.json(
        { error: "No se pudo guardar el registro de la toma." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, record: createdRecord });
  } catch (error) {
    console.error("Error en POST /api/patient/intake-logs:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}
