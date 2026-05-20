import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function assertPharmacist() {
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

  if (profileError || !profile || profile.role !== "farmaceutico") {
    return { ok: false as const, status: 403, error: "Acceso restringido." };
  }

  return { ok: true as const, pharmacistId: user.id };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authCheck = await assertPharmacist();
    if (!authCheck.ok) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status },
      );
    }

    const { id: prescriptionId } = await context.params;
    const body = (await request.json()) as { quantity?: number };

    const quantity = Number(body.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: "La cantidad a agregar debe ser un entero mayor a cero." },
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
      .select(
        "id, patient_id, medication_name, stock_actual, stock_inicial, is_active",
      )
      .eq("id", prescriptionId)
      .maybeSingle();

    if (prescriptionError) {
      return NextResponse.json(
        { error: "No se pudo consultar la prescripción." },
        { status: 500 },
      );
    }

    if (!prescription) {
      return NextResponse.json(
        { error: "Prescripción no encontrada." },
        { status: 404 },
      );
    }

    const { data: relation, error: relationError } = await adminClient
      .from("user_relations")
      .select("id")
      .eq("superior_id", authCheck.pharmacistId)
      .eq("patient_id", prescription.patient_id)
      .eq("relation_type", "farmaceutico-paciente")
      .maybeSingle();

    if (relationError) {
      return NextResponse.json(
        { error: "No se pudo validar la asignación del paciente." },
        { status: 500 },
      );
    }

    if (!relation) {
      return NextResponse.json(
        { error: "Este paciente no está asignado a tu cuenta." },
        { status: 403 },
      );
    }

    const currentStock = prescription.stock_actual ?? 0;
    const nextStock = currentStock + quantity;

    const { data: updatedPrescription, error: updateError } = await adminClient
      .from("prescriptions")
      .update({
        stock_actual: nextStock,
        stock_inicial: nextStock,
      })
      .eq("id", prescription.id)
      .select(
        "id, patient_id, medication_name, stock_actual, stock_inicial, is_active",
      )
      .maybeSingle();

    if (updateError || !updatedPrescription) {
      console.error(
        "Error actualizando stock desde farmacéutico:",
        updateError,
      );
      return NextResponse.json(
        { error: "No se pudo actualizar el stock." },
        { status: 500 },
      );
    }

    console.log(
      `[SIMULATED MESSAGE] Recarga de stock para ${updatedPrescription.medication_name}: ${currentStock} + ${quantity} = ${nextStock}`,
    );

    return NextResponse.json({
      success: true,
      prescription: updatedPrescription,
    });
  } catch (error) {
    console.error("Error en PATCH /api/prescriptions/[id]/stock:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}
