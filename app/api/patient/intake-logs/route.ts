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

    function mapStatusToDb(status: CreateIntakeLogPayload["status"]) {
      switch (status) {
        case "omitido":
          return "no_cumplido";
        default:
          return status;
      }
    }

    const { data: createdRecord, error: insertError } = await adminClient
      .from("intake_logs")
      .insert({
        patient_id: authCheck.patientId,
        prescription_id: body.prescriptionId,
        scheduled_time: body.scheduledTime,
        actual_time: body.actualTime,
        status: mapStatusToDb(body.status),
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

    let updatedPrescription: {
      id: string;
      medication_name: string;
      stock_actual: number | null;
      stock_inicial: number | null;
    } | null = null;

    if (body.status !== "omitido") {
      const { data: currentPrescription, error: currentPrescriptionError } =
        await adminClient
          .from("prescriptions")
          .select("id, medication_name, stock_actual, stock_inicial")
          .eq("id", body.prescriptionId)
          .eq("patient_id", authCheck.patientId)
          .maybeSingle();

      if (currentPrescriptionError || !currentPrescription) {
        console.error(
          "Error consultando la prescripcion para descontar stock:",
          currentPrescriptionError,
        );
      } else {
        const currentStock = currentPrescription.stock_actual ?? 0;
        const nextStock = Math.max(0, currentStock - 1);
        const { data: savedPrescription, error: stockUpdateError } =
          await adminClient
            .from("prescriptions")
            .update({ stock_actual: nextStock })
            .eq("id", currentPrescription.id)
            .select("id, medication_name, stock_actual, stock_inicial")
            .maybeSingle();

        if (stockUpdateError) {
          console.error(
            "Error actualizando stock tras registro de toma:",
            stockUpdateError,
          );
        } else {
          updatedPrescription =
            (savedPrescription as typeof updatedPrescription) ?? null;

          const stockInitial = currentPrescription.stock_inicial ?? 0;
          const stockRatio =
            stockInitial > 0 ? (nextStock / stockInitial) * 100 : null;

          console.log(
            `[SIMULATED MESSAGE] Stock actualizado para ${currentPrescription.medication_name}: ${currentStock} -> ${nextStock}`,
          );

          if (stockRatio !== null && stockRatio <= 20) {
            console.log(
              `[SIMULATED MESSAGE] Alerta de stock bajo para ${currentPrescription.medication_name}: quedan ${nextStock} unidades de ${stockInitial} (${stockRatio.toFixed(0)}%).`,
            );
          }
        }
      }
    }

    // Convertir el status de la DB a la representación en español para la UI.
    function mapDbStatusToUi(status: string) {
      switch (status) {
        case "no_cumplido":
          return "omitido";
        default:
          return status;
      }
    }

    const uiRecord = {
      ...createdRecord,
      status: mapDbStatusToUi((createdRecord as any).status),
    };

    return NextResponse.json({
      success: true,
      record: uiRecord,
      updatedPrescription,
    });
  } catch (error) {
    console.error("Error en POST /api/patient/intake-logs:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}
