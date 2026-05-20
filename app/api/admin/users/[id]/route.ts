import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const adminRoles = new Set(["admin", "administrador"]);

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const params = await context.params;
    const userIdToDelete = params.id;

    if (!userIdToDelete) {
      return NextResponse.json(
        { error: "ID de usuario invalido." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user: sessionUser },
      error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError || !sessionUser) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const { data: requesterProfile, error: requesterProfileError } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", sessionUser.id)
        .maybeSingle();

    if (requesterProfileError || !requesterProfile) {
      return NextResponse.json(
        { error: "No fue posible validar el rol del usuario." },
        { status: 403 },
      );
    }

    if (!adminRoles.has(requesterProfile.role ?? "")) {
      return NextResponse.json(
        { error: "Solo un administrador puede eliminar cuentas." },
        { status: 403 },
      );
    }

    const adminClient = createAdminClient();

    if (!adminClient) {
      return NextResponse.json(
        {
          error: "Falta la configuracion del servidor para eliminar usuarios.",
        },
        { status: 500 },
      );
    }

    const { data: targetProfile, error: targetProfileError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", userIdToDelete)
      .maybeSingle();

    if (targetProfileError) {
      return NextResponse.json(
        { error: "No se pudo consultar el usuario a eliminar." },
        { status: 500 },
      );
    }

    if (!targetProfile) {
      return NextResponse.json(
        { error: "La cuenta indicada no existe." },
        { status: 404 },
      );
    }

    if (adminRoles.has(targetProfile.role ?? "")) {
      return NextResponse.json(
        { error: "No se puede borrar una cuenta con rol de administrador." },
        { status: 403 },
      );
    }

    const { error: profileDeleteError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", userIdToDelete);

    if (profileDeleteError) {
      return NextResponse.json(
        { error: "No se pudo eliminar el perfil del usuario." },
        { status: 500 },
      );
    }

    const { error: authDeleteError } =
      await adminClient.auth.admin.deleteUser(userIdToDelete);

    if (authDeleteError) {
      const fallbackMessage = (authDeleteError.message ?? "").toLowerCase();
      if (!fallbackMessage.includes("not found")) {
        return NextResponse.json(
          { error: "No se pudo eliminar la cuenta de autenticacion." },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Ocurrio un error inesperado al eliminar la cuenta." },
      { status: 500 },
    );
  }
}
