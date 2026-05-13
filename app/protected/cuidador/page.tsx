import { redirect } from "next/navigation";

import { getCurrentUserProfile } from "@/lib/supabase/profiles";
import MiniLogo from "@/components/mini-logo";
import { LogoutButton } from "@/components/logout-button";

export default async function CaregiverDashboardPage() {
  const profile = await getCurrentUserProfile();

  if (!profile || profile.role !== "cuidador") {
    redirect("/protected");
  }

  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-gradient-to-br from-emerald-100 via-white to-teal-100 p-8">
      <header className="flex items-center justify-between mb-10">
        <MiniLogo />
        <h1 className="text-4xl font-black tracking-[0.18em] text-slate-900 uppercase">
          Cuidador
        </h1>
        <LogoutButton className="rounded-2xl border border-slate-300 bg-white/70 hover:bg-white text-slate-900 font-semibold px-6 shadow-sm h-11">
          Cerrar Sesion
        </LogoutButton>
      </header>

      <main className="flex-1 rounded-[32px] border border-slate-200 bg-white/70 p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">
          Pacientes supervisados
        </h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          En este espacio podrás revisar el estado de las tomas, omisiones y
          avisos relevantes de los pacientes que tengas vinculados en{" "}
          <span className="font-semibold">user_relations</span>.
        </p>
      </main>
    </div>
  );
}
