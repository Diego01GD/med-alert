import MiniLogo from "@/components/mini-logo";

export default function LoadingAdminSegment() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-[radial-gradient(circle_at_top_left,rgba(190,224,252,0.95),rgba(237,246,252,1)_40%,rgba(247,250,252,1)_100%)] p-6 md:p-8 lg:p-10">
      <header className="mb-8 flex items-center justify-between gap-4 rounded-[28px] border border-white/70 bg-white/70 px-5 py-4 shadow backdrop-blur-md">
        <MiniLogo />
        <div className="text-center">
          <div className="h-6 w-56 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-3 w-40 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="h-10 w-28 animate-pulse rounded bg-slate-200" />
      </header>

      <main className="flex flex-1 flex-col gap-8">
        <section className="rounded-[32px] border border-white/70 bg-white/75 p-6 shadow md:p-8">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="h-28 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse" />
            <div className="h-28 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse" />
            <div className="h-28 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse" />
            <div className="h-28 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse" />
          </div>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/75 p-6 shadow md:p-8">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 h-64 rounded-lg bg-slate-100 animate-pulse" />
        </section>
      </main>
    </div>
  );
}
