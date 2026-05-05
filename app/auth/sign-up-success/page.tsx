"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Logo from "@/components/logo";

export default function SignUpSuccessPage() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    // Timer para el contador visual
    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    // Redirección después de 5 segundos
    const redirect = setTimeout(() => {
      router.push("/auth/login");
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [router]);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 animate-in fade-in duration-700">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <Logo />
        <Card className="border-none shadow-lg text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold">
              ¡Gracias por registrarte!
            </CardTitle>
            <CardDescription className="text-[#28B4C6] font-medium">
              Verifica tu correo electrónico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Te hemos enviado un enlace de confirmación. Por favor, verifica tu
              cuenta antes de iniciar sesión.
            </p>
            
            <div className="pt-4">
              <p className="text-xs text-slate-400">
                Serás redirigido al inicio de sesión en{" "}
                <span className="font-bold text-[#A8D8FF]">{seconds}s</span>...
              </p>
              {/* Barra de progreso visual */}
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                <div 
                  className="h-full bg-[#A8D8FF] transition-all duration-1000 ease-linear"
                  style={{ width: `${(seconds / 5) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}