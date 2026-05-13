"use client";

export function PrescriptionPageSkeleton() {
  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-gradient-to-tr from-sky-200 to-white">
      {/* Header */}
      <header className="flex items-center justify-between p-6 bg-transparent">
        <div className="h-10 w-10 rounded bg-slate-300 animate-pulse" />
        <div className="h-8 w-48 rounded bg-slate-300 animate-pulse" />
        <div className="h-10 w-32 rounded-xl bg-slate-300 animate-pulse" />
      </header>

      <div className="flex flex-1 p-6 gap-6">
        <main className="flex-1 flex flex-col gap-6">
          {/* Patient Info Section */}
          <section className="bg-slate-300/50 border border-slate-400/30 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-white/50 p-3 rounded-lg border border-slate-200 animate-pulse"
                >
                  <div className="h-5 w-5 bg-slate-400 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-16 bg-slate-400 rounded" />
                    <div className="h-4 w-20 bg-slate-400 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Prescriptions Form Section */}
          <section className="bg-slate-300/50 border border-slate-400/30 rounded-lg p-6 flex-1 flex flex-col gap-4">
            <h2 className="text-xl font-bold text-center text-slate-700 uppercase">
              Sección de Stock de las recetas actuales
            </h2>

            <div className="bg-slate-400/70 border border-slate-400 rounded-lg p-8 flex-1 space-y-6">
              {/* Form Title */}
              <div className="h-6 w-2/3 bg-slate-300 rounded mx-auto animate-pulse" />

              {/* Patient Data Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-400/20 p-4 rounded-xl border border-slate-400/30">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-slate-300 rounded animate-pulse" />
                  <div className="h-10 bg-slate-300 rounded-xl animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-slate-300 rounded animate-pulse" />
                  <div className="h-10 bg-slate-300 rounded-xl animate-pulse" />
                </div>
              </div>

              {/* Medication Cards */}
              {[...Array(1)].map((_, i) => (
                <div
                  key={i}
                  className="p-6 bg-slate-300/40 rounded-2xl border border-slate-400/50 space-y-4 animate-pulse"
                >
                  <div className="h-5 w-32 bg-slate-300 rounded" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="h-3 w-12 bg-slate-300 rounded" />
                      <div className="h-10 bg-slate-300 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-16 bg-slate-300 rounded" />
                      <div className="h-10 bg-slate-300 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Button */}
              <div className="h-12 bg-slate-300 rounded-2xl animate-pulse" />

              {/* Form Footer */}
              <div className="flex justify-end gap-3 pt-8">
                <div className="h-12 w-24 bg-slate-300 rounded-xl animate-pulse" />
                <div className="h-12 w-32 bg-slate-300 rounded-xl animate-pulse" />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
