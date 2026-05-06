import { LoginForm } from "@/components/login-form";
import Logo from "@/components/logo";

export default function Page() {
  return (
    <main className="relative flex min-h-svh w-full items-center justify-center overflow-hidden p-5 md:p-10">
      {/* Background Gradient Layers */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_75%,rgba(118,188,224,0.24),transparent_42%),radial-gradient(circle_at_90%_10%,rgba(135,214,236,0.2),transparent_35%),linear-gradient(160deg,#eaf5fd_0%,#d9ebf7_48%,#c9dfef_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,rgba(255,255,255,0.28)_12%,rgba(255,255,255,0.07)_36%,transparent_58%)]" />

      {/* Form Container */}
      <div className="relative z-10 flex flex-col w-full max-w-[700px] justify-center rounded-[30px] border border-[#b7d8ea] bg-[linear-gradient(180deg,rgba(197,233,249,0.95)_0%,rgba(226,245,252,0.92)_42%,rgba(248,252,254,0.9)_100%)] px-5 py-7 shadow-[0_24px_60px_-28px_rgba(45,100,140,0.45)] backdrop-blur-sm md:px-10 md:py-10">
        <Logo />
        <p className="italic text-center mb-6">Tu bienestar, nuestra prioridad</p>
        <LoginForm />
      </div>

      {/* Emergency Call Button */}
      <a
        href="tel:911"
        className="fixed bottom-5 right-5 rounded-full bg-[#f08cad] hover:bg-[#e67aa0] px-8 py-3 text-sm font-bold text-white shadow-[0_10px_24px_-12px_rgba(170,47,95,0.85)] transition-all hover:scale-105 duration-200 z-50"
      >
        Llamada de Emergencia
      </a>
    </main>
  );
}