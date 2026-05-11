import { PrescriptionForm } from "@/components/prescriptions/prescription-form";
import MiniLogo from "@/components/mini-logo";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import Link from "next/link";

export default function PrescriptionsPage() {
  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-gradient-to-tr from-sky-200 to-white">
      {/* Header Estilo "FARMACEUTICO" */}
      <header className="flex items-center justify-between p-6 bg-transparent">
        <div className="flex items-center gap-2">
          <MiniLogo />
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">
          FARMACEUTICO
        </h1>
        <Button variant="outline" className="rounded-xl border-slate-900 bg-slate-200 hover:bg-slate-300 text-black font-bold px-6">
          <Link href="/auth/logout" className="flex items-center gap-2">
            Cerrar Sesion
          </Link>
        </Button>
      </header>

      <div className="flex flex-1 p-6 gap-6">
        {/* Content Area - Ahora ocupa todo el ancho */}
        <main className="flex-1 flex flex-col gap-6">
          {/* Top Panel "Sección del paciente seleccionado" */}
          <section className="bg-slate-300/50 border border-slate-400/30 rounded-lg p-8 flex items-center justify-center min-h-[150px]">
            <h2 className="text-xl font-bold text-slate-700">Sección del paciente seleccionado</h2>
          </section>

          {/* Bottom Panel "Sección de Stock" */}
          <section className="bg-slate-300/50 border border-slate-400/30 rounded-lg p-6 flex-1 flex flex-col gap-4">
            <h2 className="text-xl font-bold text-center text-slate-700 uppercase">
              Sección de Stock de las recetas actuales
            </h2>
            
            <div className="bg-slate-400/70 border border-slate-400 rounded-lg p-8 flex-1">
              <PrescriptionForm />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
