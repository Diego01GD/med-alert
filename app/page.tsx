"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import MiniLogo from "@/components/mini-logo";
import { CheckCircle2, ShieldCheck, BellRing, Users } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(Boolean(data.session));
    };

    void loadSession();
  }, []);

  const handlePrimaryAction = () => {
    router.push("/protected/");
  };

  return (
    <div className="flex flex-col min-h-screen bg-linear-to-tr from-sky-400 to-slate-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
        <MiniLogo />
        <div className="hidden md:flex gap-8 text-sm font-medium">
          <Link
            href="#features"
            className="hover:text-sky-700 transition-colors"
          >
            Funcionalidades
          </Link>
          <Link
            href="#security"
            className="hover:text-sky-700 transition-colors"
          >
            Seguridad
          </Link>
        </div>
        {isLoggedIn === null ? (
          <Button
            className="bg-[#A8D8FF] text-black hover:bg-[#8ec7f5] rounded-full px-6"
            disabled
          >
            Cargando...
          </Button>
        ) : isLoggedIn ? (
          <Button
            onClick={handlePrimaryAction}
            className="bg-[#A8D8FF] text-black hover:bg-[#8ec7f5] rounded-full px-6"
          >
            Ir a Dashboard
          </Button>
        ) : (
          <Button
            asChild
            className="bg-[#A8D8FF] text-black hover:bg-[#8ec7f5] rounded-full px-6"
          >
            <Link href="/auth/login">Iniciar Sesión</Link>
          </Button>
        )}
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="px-6 py-16 md:py-24 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6">
            La forma más inteligente de{" "}
            <span className="text-[#28B4C6]">cuidar tu salud</span>
          </h1>
          <p className="text-lg text-slate-600 mb-10 leading-relaxed">
            MedAlert simplifica tu tratamiento médico. Recordatorios precisos,
            detección de interacciones y reportes de adherencia en tiempo real.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button
                size="lg"
                className="bg-[#28B4C6] hover:bg-[#2198a8] text-white rounded-2xl px-8 py-7 text-lg shadow-lg"
              >
                Crear mi cuenta
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-300 rounded-2xl px-8 py-7 text-lg bg-white/50 backdrop-blur-sm"
            >
              Saber más
            </Button>
          </div>
        </section>

        {/* Features Grid */}
        <section
          id="features"
          className="px-6 py-20 bg-white/30 backdrop-blur-md"
        >
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<BellRing className="text-[#28B4C6]" />}
              title="Alertas Inteligentes"
              description="Notificaciones escalonadas y personalizadas para que nunca olvides una toma."
            />
            <FeatureCard
              icon={<ShieldCheck className="text-[#28B4C6]" />}
              title="Interacciones"
              description="Análisis automático de riesgos entre medicamentos registrados."
            />
            <FeatureCard
              icon={<Users className="text-[#28B4C6]" />}
              title="Modo Familiar"
              description="Supervisa el cumplimiento de tus seres queridos desde cualquier lugar."
            />
            <FeatureCard
              icon={<CheckCircle2 className="text-[#28B4C6]" />}
              title="Reportes Médicos"
              description="Gráficas de adherencia exportables para tu próxima consulta."
            />
          </div>
        </section>

        {/* Security Info */}
        <section id="security" className="px-6 py-20 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">
              Privacidad de grado médico
            </h2>
            <p className="text-slate-600">
              Tus datos están protegidos con cifrado de extremo a extremo. Solo
              tú, tus familiares autorizados y tu médico verificado tienen
              acceso a tu historial.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="p-10 border-t border-slate-200 text-center text-sm text-slate-500">
        <p>&copy; 2026 MedAlert Mérida. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col items-center text-center">
      <div className="mb-4 p-3 bg-sky-50 rounded-2xl">{icon}</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-slate-500 text-sm">{description}</p>
    </div>
  );
}
