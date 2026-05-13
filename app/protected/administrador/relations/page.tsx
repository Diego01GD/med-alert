import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getCurrentUserProfile } from "@/lib/supabase/profiles";
import { createAdminClient } from "@/lib/supabase/admin";
import MiniLogo from "@/components/mini-logo";
import { LogoutButton } from "@/components/logout-button";
import { RelationsCreateForm } from "@/components/admin/relations-create-form";

type SimpleUser = {
  id: string;
  full_name: string | null;
  role: string | null;
};

export default async function AdminRelationsPage() {
  const profile = await getCurrentUserProfile();

  if (!profile || !["admin", "administrador"].includes(profile.role ?? "")) {
    redirect("/protected");
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    throw new Error(
      "Falta la configuración del servidor para el módulo de relaciones.",
    );
  }

  const usersResult = await adminClient
    .from("profiles")
    .select("id, full_name, role")
    .order("full_name", { ascending: true });

  if (usersResult.error) {
    throw usersResult.error;
  }

  const users = (usersResult.data ?? []) as SimpleUser[];

  return (
    <div className="flex min-h-screen w-full flex-col bg-[radial-gradient(circle_at_top_left,rgba(190,224,252,0.95),rgba(237,246,252,1)_40%,rgba(247,250,252,1)_100%)] p-6 md:p-8 lg:p-10">
      <header className="mb-8 flex items-center justify-between gap-4 rounded-[28px] border border-white/70 bg-white/70 px-5 py-4 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.4)] backdrop-blur-md">
        <MiniLogo />
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-[0.16em] text-slate-900 uppercase md:text-4xl">
            RELACIONES
          </h1>
          <p className="mt-1 text-sm text-slate-600">Panel de Asignaciones</p>
        </div>
        <LogoutButton className="rounded-2xl border border-slate-300 bg-white/70 hover:bg-white text-slate-900 font-semibold px-6 shadow-sm h-11">
          Cerrar Sesion
        </LogoutButton>
      </header>

      <main className="flex flex-1 flex-col gap-6">
        <div>
          <Link href="/protected/administrador">
            <Button
              variant="ghost"
              className="gap-2 text-slate-700 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al panel de administrador
            </Button>
          </Link>
        </div>

        <section className="rounded-[32px] border border-white/70 bg-white/75 p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.35)] md:p-8">
          <RelationsCreateForm users={users} />
        </section>
      </main>
    </div>
  );
}
