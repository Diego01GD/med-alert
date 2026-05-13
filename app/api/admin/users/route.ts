import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateSecurePassword } from "@/lib/utils/password-generator";

const adminRoles = new Set(["admin", "administrador"]);

type CreateUserPayload = {
  role: "medico" | "farmaceutico" | "cuidador";
  full_name: string;
  cedula_profesional?: string | null;
  especialidad?: string | null;
  email: string;
  phone_number: string;
};

async function simulateCredentialDelivery(
  phoneNumber: string,
  email: string,
  password: string,
): Promise<{
  destino_telefono: string;
  credenciales: {
    correo: string;
    password_temporal: string;
  };
}> {
  const payload = {
    destino_telefono: phoneNumber,
    credenciales: {
      correo: email,
      password_temporal: password,
    },
  };

  console.log("[SIMULACION_ENVIO_CREDENCIALES]", payload);
  return payload;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateUserPayload;

    // Validar entrada
    if (
      !payload.role ||
      !payload.full_name ||
      !payload.email ||
      !payload.phone_number
    ) {
      return NextResponse.json(
        { error: "Faltan campos requeridos." },
        { status: 400 },
      );
    }

    // Verificar que quien hace la solicitud sea admin
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
        { error: "Solo un administrador puede crear cuentas." },
        { status: 403 },
      );
    }

    // Obtener cliente admin (requerido para crear en auth)
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Falta la configuración del servidor para crear usuarios." },
        { status: 500 },
      );
    }

    // Verificar que el email no exista
    const { data: existingUsers, error: checkEmailError } =
      await adminClient.auth.admin.listUsers();

    if (checkEmailError) {
      return NextResponse.json(
        { error: "No se pudo validar el correo electrónico." },
        { status: 500 },
      );
    }

    const emailExists = existingUsers.users.some(
      (user) => user.email === payload.email,
    );
    if (emailExists) {
      return NextResponse.json(
        { error: "El correo electrónico ya está registrado." },
        { status: 409 },
      );
    }

    const generatedPassword = generateSecurePassword();

    // Crear usuario en auth.users
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: payload.email,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: {
          role: payload.role,
          full_name: payload.full_name,
          phone_number: payload.phone_number,
          cedula_profesional: payload.cedula_profesional ?? null,
          especialidad: payload.especialidad ?? null,
        },
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "No se pudo crear la cuenta de autenticación." },
        { status: 500 },
      );
    }

    // Crear o actualizar el perfil en public.profiles para evitar choques con triggers automáticos
    const { error: profileError } = await adminClient.from("profiles").upsert(
      {
        id: authData.user.id,
        role: payload.role,
        full_name: payload.full_name,
        phone_number: payload.phone_number,
      },
      {
        onConflict: "id",
      },
    );

    if (profileError) {
      // Intentar limpiar la cuenta de auth si falla el perfil
      await adminClient.auth.admin.deleteUser(authData.user.id).catch(() => {
        // Ignorar errores en cleanup
      });

      return NextResponse.json(
        { error: "No se pudo crear el perfil del usuario." },
        { status: 500 },
      );
    }

    // Simular envío de credenciales por terminal
    let deliveryPayload: {
      destino_telefono: string;
      credenciales: {
        correo: string;
        password_temporal: string;
      };
    } | null = null;

    try {
      deliveryPayload = await simulateCredentialDelivery(
        payload.phone_number,
        payload.email,
        generatedPassword,
      );
    } catch (deliveryError) {
      console.error("Error simulando envío de credenciales:", deliveryError);
      // No fallar la creación si falla la simulación
    }

    return NextResponse.json({
      success: true,
      userId: authData.user.id,
      delivery: deliveryPayload,
    });
  } catch (error) {
    console.error("Error en POST /api/admin/users:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado al crear la cuenta." },
      { status: 500 },
    );
  }
}
