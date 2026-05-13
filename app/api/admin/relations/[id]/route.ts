import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const adminRoles = new Set(["admin", "administrador"]);

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
      error: "Solo un administrador puede eliminar relaciones.",
    };
  }

  return { ok: true as const };
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authCheck = await assertAdmin();
    if (!authCheck.ok) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status },
      );
    }

    const params = await context.params;
    const relationId = params.id;

    if (!relationId) {
      return NextResponse.json(
        { error: "ID de relación inválido." },
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

    const { error } = await adminClient
      .from("user_relations")
      .delete()
      .eq("id", relationId);

    if (error) {
      return NextResponse.json(
        { error: "No se pudo eliminar la relación." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, id: relationId });
  } catch (error) {
    console.error("Error en DELETE /api/admin/relations/[id]:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado al eliminar la relación." },
      { status: 500 },
    );
  }
}
