import { redirect } from "next/navigation";

import { getCurrentUserProfile } from "@/lib/supabase/profiles";
import MiniLogo from "@/components/mini-logo";
import { LogoutButton } from "@/components/logout-button";

export default async function PatientDashboardPage() {
  const profile = await getCurrentUserProfile();

  if (!profile || profile.role !== "paciente") {
    redirect("/protected");
  }

  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-gradient-to-br from-sky-100 via-white to-cyan-100 p-8">
      <header className="flex items-center justify-between mb-10">
        <MiniLogo />
        <h1 className="text-4xl font-black tracking-[0.18em] text-slate-900 uppercase">
          Paciente
        </h1>
        <LogoutButton className="rounded-2xl border border-slate-300 bg-white/70 hover:bg-white text-slate-900 font-semibold px-6 shadow-sm h-11">
          Cerrar Sesion
        </LogoutButton>
      </header>

      <main className="flex-1 rounded-[32px] border border-slate-200 bg-white/70 p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">
          Tu panel de tratamiento
        </h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          Aquí se mostrarán tus prescripciones activas, próximas tomas,
          historial de cumplimiento y alertas personales.
        </p>
      </main>
    </div>
  );
}
