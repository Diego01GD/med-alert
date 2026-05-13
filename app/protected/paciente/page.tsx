import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/supabase/profiles";
import MiniLogo from "@/components/mini-logo";
import { LogoutButton } from "@/components/logout-button";
import PanelPaciente from "./components/panelpaciente"; 
// 1. Importamos la función encargada de consultar Supabase
import { obtenerPrescriptionsDelPaciente } from "./actions";

export default async function PatientDashboardPage() {
  const profile = await getCurrentUserProfile();

  if (!profile || profile.role !== "paciente") {
    redirect("/protected");
  }

  // 2. Intentamos traer los medicamentos reales desde Supabase usando el ID del paciente
  let medicamentosReales = [];
  try {
    medicamentosReales = await obtenerPrescriptionsDelPaciente(profile.id);
  } catch (error) {
    console.error("Error al cargar las recetas de Supabase:", error);
    // Si la BD falla por algún motivo, aseguramos que devuelva una lista vacía en lugar de undefined
    medicamentosReales = [];
  }

  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-gradient-to-br from-sky-100 via-white to-cyan-100 p-4 sm:p-8 justify-center items-center">
      
      {/* CONTENEDOR ANFITRIÓN DE LA VISTA MÓVIL */}
      <div className="w-full max-w-md flex flex-col">
        
        {/* HEADER ALINEADO AL MARGEN DEL CUADRO BLANCO */}
        <header className="flex items-center justify-between mb-4 px-2 w-full">
          <div className="flex items-center gap-2">
            <MiniLogo />
          </div>

          <h1 className="text-lg font-black tracking-[0.15em] text-slate-900 uppercase">
            Paciente
          </h1>

          <LogoutButton className="rounded-xl border border-slate-300 bg-white/70 hover:bg-white text-slate-900 font-semibold px-3 shadow-sm h-9 text-xs transition-colors">
            Cerrar Sesión
          </LogoutButton>
        </header>

        {/* INYECCIÓN DEL COMPONENTE CLIENTE INTERACTIVO */}
        {/* 3. Le inyectamos los datos reales protegidos con un fallback por seguridad */}
        <PanelPaciente datosIniciales={medicamentosReales || []} />
        
      </div>
    </div>
  );
}