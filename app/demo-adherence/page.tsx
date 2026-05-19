import { AdherenceDashboard } from "@/components/doctor/adherence-dashboard";
import MiniLogo from "@/components/mini-logo";

// Datos de ejemplo que demuestran cómo el dashboard funciona
// En producción, estos datos vendrían de la base de datos (intake_logs)
const DEMO_PATIENTS = [
  {
    id: "1",
    full_name: "Juan Pérez Ramírez",
    intakeLogs: Array.from({ length: 50 }, (_, i) => ({
      id: `log-1-${i}`,
      prescription_id: `prescription-1-${i}`,
      scheduled_time: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      actual_time: Math.random() > 0.15 ? new Date(Date.now() - i * 24 * 60 * 60 * 1000 + Math.random() * 60 * 60 * 1000).toISOString() : null,
      status: (["cumplido", "cumplido", "cumplido", "cumplido", "cumplido", "atrasado", "omitido"][Math.floor(Math.random() * 7)]) as "cumplido" | "atrasado" | "omitido",
      omission_reason: Math.random() > 0.7 ? "Olvido" : null,
      observations: null,
    })),
  },
  {
    id: "2",
    full_name: "María López Gómez",
    intakeLogs: Array.from({ length: 50 }, (_, i) => ({
      id: `log-2-${i}`,
      prescription_id: `prescription-2-${i}`,
      scheduled_time: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      actual_time: Math.random() > 0.10 ? new Date(Date.now() - i * 24 * 60 * 60 * 1000 + Math.random() * 60 * 60 * 1000).toISOString() : null,
      status: (["cumplido", "cumplido", "cumplido", "cumplido", "cumplido", "cumplido", "atrasado", "omitido"][Math.floor(Math.random() * 8)]) as "cumplido" | "atrasado" | "omitido",
      omission_reason: Math.random() > 0.8 ? "No tenía el medicamento" : null,
      observations: null,
    })),
  },
  {
    id: "3",
    full_name: "Ana Torres Martínez",
    intakeLogs: Array.from({ length: 50 }, (_, i) => ({
      id: `log-3-${i}`,
      prescription_id: `prescription-3-${i}`,
      scheduled_time: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      actual_time: Math.random() > 0.32 ? new Date(Date.now() - i * 24 * 60 * 60 * 1000 + Math.random() * 60 * 60 * 1000).toISOString() : null,
      status: (["cumplido", "cumplido", "atrasado", "atrasado", "omitido", "omitido"][Math.floor(Math.random() * 6)]) as "cumplido" | "atrasado" | "omitido",
      omission_reason: Math.random() > 0.5 ? "Olvido" : null,
      observations: null,
    })),
  },
  {
    id: "4",
    full_name: "Luis Hernández Díaz",
    intakeLogs: Array.from({ length: 50 }, (_, i) => ({
      id: `log-4-${i}`,
      prescription_id: `prescription-4-${i}`,
      scheduled_time: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      actual_time: Math.random() > 0.45 ? new Date(Date.now() - i * 24 * 60 * 60 * 1000 + Math.random() * 60 * 60 * 1000).toISOString() : null,
      status: (["cumplido", "atrasado", "atrasado", "omitido", "omitido", "omitido"][Math.floor(Math.random() * 6)]) as "cumplido" | "atrasado" | "omitido",
      omission_reason: Math.random() > 0.4 ? "Olvido" : null,
      observations: null,
    })),
  },
  {
    id: "5",
    full_name: "Carlos Ruíz Sánchez",
    intakeLogs: Array.from({ length: 50 }, (_, i) => ({
      id: `log-5-${i}`,
      prescription_id: `prescription-5-${i}`,
      scheduled_time: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      actual_time: Math.random() > 0.52 ? new Date(Date.now() - i * 24 * 60 * 60 * 1000 + Math.random() * 60 * 60 * 1000).toISOString() : null,
      status: (["cumplido", "atrasado", "omitido", "omitido", "omitido"][Math.floor(Math.random() * 5)]) as "cumplido" | "atrasado" | "omitido",
      omission_reason: Math.random() > 0.4 ? "Olvido" : null,
      observations: null,
    })),
  },
];

export default function DemoAdherancePage() {
  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-[#BDE5FF] p-8">
      <header className="flex items-center justify-between bg-transparent mb-8 px-4">
        <div className="flex flex-col items-center">
          <MiniLogo />
        </div>
        <h1 className="text-5xl font-black tracking-[0.15em] text-[#001D3D] uppercase">
          MEDICO - DEMOSTRACIÓN
        </h1>
        <button className="rounded-2xl border border-slate-900 bg-[#C9D9E6] hover:bg-slate-300 text-black font-bold px-10 shadow-sm h-14 text-base">
          Cerrar Sesion
        </button>
      </header>

      <main className="flex-1 flex flex-col gap-6 max-w-[98%] mx-auto w-full">
        <div className="bg-slate-50/50 rounded-[40px] p-6 lg:p-10">
          <AdherenceDashboard patients={DEMO_PATIENTS} timeRange="7days" />
        </div>
      </main>
    </div>
  );
}
