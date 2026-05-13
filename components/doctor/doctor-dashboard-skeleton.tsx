"use client";

export function DoctorDashboardSkeleton() {
  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-[#BDE5FF] p-8">
      {/* Header */}
      <header className="flex items-center justify-between bg-transparent mb-8 px-4">
        <div className="h-10 w-10 rounded bg-slate-300 animate-pulse" />
        <div className="h-12 w-48 rounded bg-slate-300 animate-pulse" />
        <div className="h-14 w-32 rounded-2xl bg-slate-300 animate-pulse" />
      </header>

      <main className="flex-1 flex flex-col gap-6 max-w-[98%] mx-auto w-full bg-slate-50/50 rounded-[40px] p-6 lg:p-10 mb-8">
        {/* Info Section */}
        <section className="bg-[#A4B4C4] border border-slate-500/30 rounded-[35px] p-12 flex items-center justify-center gap-6">
          <div className="h-12 w-12 rounded bg-slate-400 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-3/4 rounded bg-slate-400 animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-slate-400 animate-pulse" />
          </div>
        </section>

        {/* Patients Section */}
        <section className="flex-[2] bg-[#D1DEE8] border border-slate-500 rounded-lg p-10 flex flex-col gap-6 shadow-sm min-h-[500px]">
          <h2 className="text-4xl font-black text-center text-slate-900 leading-tight mb-4 tracking-tight">
            Sección de pacientes asignados
          </h2>

          <div className="flex-1 bg-[#94A4B4] border border-slate-600 rounded-lg overflow-hidden flex flex-col min-h-[400px]">
            {/* Header */}
            <div className="grid grid-cols-3 bg-slate-800 text-white p-6 font-bold uppercase tracking-wider text-xl">
              <div className="px-4">Nombre del paciente</div>
              <div className="px-4 text-center">Edad</div>
              <div className="px-4 text-center">Peso</div>
            </div>

            {/* Skeleton Rows */}
            <div className="flex-1 overflow-auto">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-3 items-center border-t border-slate-600/40 p-6 animate-pulse"
                >
                  <div className="px-4 h-6 bg-slate-400 rounded" />
                  <div className="px-4 h-6 bg-slate-400 rounded mx-auto w-12" />
                  <div className="px-4 h-6 bg-slate-400 rounded mx-auto w-12" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
