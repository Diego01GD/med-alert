import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const adminRoles = new Set(["admin", "administrador"]);

type CreateRelationPayload = {
  superior_id: string;
  patient_id: string;
  relation_type: string;
};

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user: sessionUser },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (sessionError || !sessionUser) {
    return { ok: false as const, status: 401, error: "No autorizado." };
  }

  const { data: requesterProfile, error: requesterProfileError } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", sessionUser.id)
      .maybeSingle();

  if (requesterProfileError || !requesterProfile) {
    return {
      ok: false as const,
      status: 403,
      error: "No fue posible validar el rol del usuario.",
    };
  }

  if (!adminRoles.has(requesterProfile.role ?? "")) {
    return {
      ok: false as const,
      status: 403,
      error: "Solo un administrador puede gestionar relaciones.",
    };
  }

  return { ok: true as const };
}

export async function GET() {
  try {
    const authCheck = await assertAdmin();
    if (!authCheck.ok) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status },
      );
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Falta la configuración del servidor." },
        { status: 500 },
      );
    }

    const { data, error } = await adminClient
      .from("user_relations")
      .select(
        "id, relation_type, created_at, superior:superior_id(id, full_name, role), patient:patient_id(id, full_name, role)",
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "No se pudieron consultar las relaciones." },
        { status: 500 },
      );
    }

    return NextResponse.json({ relations: data ?? [] });
  } catch (error) {
    console.error("Error en GET /api/admin/relations:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado al obtener relaciones." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authCheck = await assertAdmin();
    if (!authCheck.ok) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status },
      );
    }

    const payload = (await request.json()) as CreateRelationPayload;

    if (!payload.superior_id || !payload.patient_id || !payload.relation_type) {
      return NextResponse.json(
        { error: "Faltan campos requeridos." },
        { status: 400 },
      );
    }

    if (payload.superior_id === payload.patient_id) {
      return NextResponse.json(
        { error: "No se puede relacionar un usuario consigo mismo." },
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

    const { data: duplicated, error: duplicatedError } = await adminClient
      .from("user_relations")
      .select("id")
      .eq("superior_id", payload.superior_id)
      .eq("patient_id", payload.patient_id)
      .eq("relation_type", payload.relation_type)
      .maybeSingle();

    if (duplicatedError) {
      return NextResponse.json(
        { error: "No se pudo validar si la relación ya existe." },
        { status: 500 },
      );
    }

    if (duplicated) {
      return NextResponse.json(
        { error: "Esta relación ya existe." },
        { status: 409 },
      );
    }

    // Validar que superior y paciente existan y tengan roles esperados
    const { data: superiorProfile, error: supProfileError } = await adminClient
      .from("profiles")
      .select("id, role")
      .eq("id", payload.superior_id)
      .maybeSingle();

    if (supProfileError || !superiorProfile) {
      return NextResponse.json(
        { error: "El superior seleccionado no existe." },
        { status: 400 },
      );
    }

    const { data: patientProfile, error: patientProfileError } =
      await adminClient
        .from("profiles")
        .select("id, role")
        .eq("id", payload.patient_id)
        .maybeSingle();

    if (patientProfileError || !patientProfile) {
      return NextResponse.json(
        { error: "El paciente seleccionado no existe." },
        { status: 400 },
      );
    }

    // Asegurar que el paciente tenga rol 'paciente'
    if ((patientProfile.role ?? "") !== "paciente") {
      return NextResponse.json(
        {
          error:
            "El usuario seleccionado como paciente no tiene rol 'paciente'.",
        },
        { status: 400 },
      );
    }

    // Validar relation_type contra valores permitidos y que concuerde con el rol del superior
    const allowedRelationTypes = new Set([
      "medico-paciente",
      "cuidador-paciente",
      "farmaceutico-paciente",
    ]);

    if (!allowedRelationTypes.has(payload.relation_type)) {
      return NextResponse.json(
        {
          error: `Tipo de relación inválido. Valores permitidos: ${[...allowedRelationTypes].join(", ")}`,
        },
        { status: 400 },
      );
    }

    const superiorRole = (superiorProfile.role ?? "").toLowerCase();
    const expectedType = `${superiorRole}-paciente`;
    if (payload.relation_type !== expectedType) {
      return NextResponse.json(
        {
          error: `El tipo de relación debe concordar con el rol del superior. Para rol '${superiorRole}' use '${expectedType}'.`,
        },
        { status: 400 },
      );
    }

    const { data, error } = await adminClient
      .from("user_relations")
      .insert({
        superior_id: payload.superior_id,
        patient_id: payload.patient_id,
        relation_type: payload.relation_type,
      })
      .select("id, relation_type, created_at")
      .single();

    if (error) {
      console.error("DB error creating relation:", error);
      return NextResponse.json(
        { error: error.message || "No se pudo crear la relación." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, relation: data });
  } catch (error) {
    console.error("Error en POST /api/admin/relations:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado al crear la relación." },
      { status: 500 },
    );
  }
}
