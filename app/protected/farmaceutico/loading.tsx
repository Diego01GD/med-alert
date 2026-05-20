export default function Loading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#E0F2FE] via-[#F0F9FF] to-[#E0F2FE] p-8">
      <div className="w-full max-w-4xl rounded-[32px] border border-white/70 bg-white/85 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="h-10 w-28 animate-pulse rounded-full bg-slate-200" />
          <div className="h-10 w-40 animate-pulse rounded-full bg-slate-200" />
        </div>

        <div className="space-y-4">
          <div className="h-6 w-56 animate-pulse rounded-full bg-slate-200" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-16 animate-pulse rounded-3xl bg-slate-100" />
            <div className="h-16 animate-pulse rounded-3xl bg-slate-100" />
            <div className="h-16 animate-pulse rounded-3xl bg-slate-100" />
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="h-[520px] animate-pulse rounded-[28px] bg-slate-100" />
          <div className="space-y-6">
            <div className="h-[180px] animate-pulse rounded-[28px] bg-slate-100" />
            <div className="h-[320px] animate-pulse rounded-[28px] bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
