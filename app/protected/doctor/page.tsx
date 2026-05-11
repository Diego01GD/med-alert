import MiniLogo from "@/components/mini-logo";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";
import Link from "next/link";

export default function DoctorDashboardPage() {
  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-[#BDE5FF] p-8">
      {/* Header Estilo "MEDICO" - Fuera del cuadro central */}
      <header className="flex items-center justify-between bg-transparent mb-8 px-4">
        <div className="flex flex-col items-center">
          <MiniLogo />
        </div>
        <h1 className="text-5xl font-black tracking-[0.15em] text-[#001D3D] uppercase">
          MEDICO
        </h1>
        <Button variant="outline" className="rounded-2xl border border-slate-900 bg-[#C9D9E6] hover:bg-slate-300 text-black font-bold px-10 shadow-sm h-14 text-base">
          <Link href="/auth/logout">
            Cerrar Sesion
          </Link>
        </Button>
      </header>

      <main className="flex-1 flex flex-col gap-6 max-w-[98%] mx-auto w-full bg-slate-50/50 rounded-[40px] p-6 lg:p-10">
        {/* Panel de Alertas/Recomendaciones - Bordes más redondeados y sin sombra fuerte */}
        <section className="bg-[#A4B4C4] border border-slate-500/30 rounded-[35px] p-12 flex items-center justify-center gap-6 text-center shadow-sm">
          <InfoIcon className="h-12 w-12 text-slate-900" />
          <p className="text-xl font-bold text-slate-900 max-w-3xl leading-tight tracking-tight">
            Esta parte puede tomar los colores, rojo, naranja o azul para las recomendaciones o avisos criticos
          </p>
        </section>

        {/* Sección de Pacientes Asignados - Rectangular y nítida */}
        <section className="bg-[#D1DEE8] border border-slate-500 rounded-lg p-10 flex flex-col gap-6 shadow-sm">
          <h2 className="text-4xl font-black text-center text-slate-900 leading-tight mb-4 tracking-tight">
            Sección de pacientes asignados
          </h2>
          
          {/* Tabla de pacientes - Columnas preparadas */}
          <div className="bg-[#94A4B4] border border-slate-600 rounded-lg overflow-hidden">
            {/* Cabecera de la tabla */}
            <div className="grid grid-cols-3 bg-slate-800 text-white p-4 font-bold uppercase tracking-wider text-sm">
              <div className="px-4">Nombre del paciente</div>
              <div className="px-4 text-center">Edad</div>
              <div className="px-4 text-center">Peso</div>
            </div>
            
            {/* Cuerpo de la tabla (Simulado/Placeholder para datos futuros) */}
            <div className="flex flex-col min-h-[300px] items-center justify-center text-center p-10">
              <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none opacity-40">
                Los datos de los pacientes <br /> aparecerán aquí
              </h3>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
