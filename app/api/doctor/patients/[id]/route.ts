import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authCheck = await assertDoctor();
    if (!authCheck.ok) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status },
      );
    }

    const { id: patientId } = await context.params;
    const adminClient = createAdminClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: "Falta la configuracion del servidor." },
        { status: 500 },
      );
    }

    const { data: patient, error: patientError } = await adminClient
      .from("profiles")
      .select("id, role, full_name, age, weight, phone_number")
      .eq("id", patientId)
      .maybeSingle();

    if (patientError) {
      return NextResponse.json(
        { error: "No se pudo consultar el paciente." },
        { status: 500 },
      );
    }

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente no encontrado." },
        { status: 404 },
      );
    }

    const { data: relation, error: relationError } = await adminClient
      .from("user_relations")
      .select("id, relation_type")
      .eq("superior_id", authCheck.doctorId)
      .eq("patient_id", patientId)
      .maybeSingle();

    if (relationError) {
      return NextResponse.json(
        { error: "No se pudo validar la asignacion." },
        { status: 500 },
      );
    }

    if (!relation) {
      return NextResponse.json(
        { error: "Este paciente no está asignado a tu cuenta." },
        { status: 403 },
      );
    }

    const { data: prescriptions, error: prescriptionsError } = await adminClient
      .from("prescriptions")
      .select(
        "id, medication_name, dosage_info, frequency_hours, stock_actual, is_active, created_at",
      )
      .eq("patient_id", patientId)
      .eq("doctor_id", authCheck.doctorId)
      .order("created_at", { ascending: false });

    if (prescriptionsError) {
      return NextResponse.json(
        { error: "No se pudo consultar el historial de medicaciones." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      patient,
      relation,
      prescriptions: prescriptions ?? [],
    });
  } catch (error) {
    console.error("Error en GET /api/doctor/patients/[id]:", error);
    return NextResponse.json(
      { error: "Ocurrio un error inesperado al obtener el paciente." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authCheck = await assertDoctor();
    if (!authCheck.ok) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status },
      );
    }

    const { id: patientId } = await context.params;
    const body = (await request.json()) as {
      age?: number | null;
      weight?: number | null;
    };

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Falta la configuracion del servidor." },
        { status: 500 },
      );
    }

    const { data: relation, error: relationError } = await adminClient
      .from("user_relations")
      .select("id")
      .eq("superior_id", authCheck.doctorId)
      .eq("patient_id", patientId)
      .maybeSingle();

    if (relationError) {
      return NextResponse.json(
        { error: "No se pudo validar la asignacion." },
        { status: 500 },
      );
    }

    if (!relation) {
      return NextResponse.json(
        { error: "Este paciente no está asignado a tu cuenta." },
        { status: 403 },
      );
    }

    const updateData: { age?: number | null; weight?: number | null } = {};

    if (body.age !== undefined) {
      updateData.age = body.age;
    }
    if (body.weight !== undefined) {
      updateData.weight = body.weight;
    }

    const { data: updatedPatient, error: updateError } = await adminClient
      .from("profiles")
      .update(updateData)
      .eq("id", patientId)
      .select("id, full_name, age, weight")
      .maybeSingle();

    if (updateError) {
      return NextResponse.json(
        { error: "No se pudieron actualizar los datos del paciente." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, patient: updatedPatient });
  } catch (error) {
    console.error("Error en PATCH /api/doctor/patients/[id]:", error);
    return NextResponse.json(
      { error: "Ocurrio un error inesperado al actualizar el paciente." },
      { status: 500 },
    );
  }
}
