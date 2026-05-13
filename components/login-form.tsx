"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDashboardPathForRole } from "@/lib/auth/roles";
import { hasEnvVars } from "@/lib/utils";

const ATTEMPT_WINDOW_MS = 5 * 60 * 1000;
const LOCK_DURATION_MS = 15 * 60 * 1000;

type LoginSecurityState = {
  failedAttempts: number;
  windowStartedAt: number;
  lockedUntil: number | null;
};

function getSecurityKey(email: string) {
  return `med-alert-login-security:${email.trim().toLowerCase()}`;
}

function readSecurityState(email: string): LoginSecurityState | null {
  if (typeof window === "undefined" || !email.trim()) {
    return null;
  }

  const rawState = window.localStorage.getItem(getSecurityKey(email));
  if (!rawState) {
    return null;
  }

  try {
    return JSON.parse(rawState) as LoginSecurityState;
  } catch {
    return null;
  }
}

function writeSecurityState(email: string, state: LoginSecurityState) {
  window.localStorage.setItem(getSecurityKey(email), JSON.stringify(state));
}

function clearSecurityState(email: string) {
  window.localStorage.removeItem(getSecurityKey(email));
}

function formatRemainingTime(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState<number | null>(
    null,
  );
  const router = useRouter();

  useEffect(() => {
    if (!email.trim()) {
      setBlockTimeRemaining(null);
      return;
    }

    const syncBlockState = () => {
      const securityState = readSecurityState(email);
      if (!securityState?.lockedUntil) {
        setBlockTimeRemaining(null);
        return;
      }

      const remaining = securityState.lockedUntil - Date.now();
      if (remaining <= 0) {
        clearSecurityState(email);
        setBlockTimeRemaining(null);
        return;
      }

      setBlockTimeRemaining(remaining);
    };

    syncBlockState();
    const intervalId = window.setInterval(syncBlockState, 1000);

    return () => window.clearInterval(intervalId);
  }, [email]);

  useEffect(() => {
    const savedEmail = window.localStorage.getItem("med-alert-remember-email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const registerFailedAttempt = (normalizedEmail: string) => {
    const now = Date.now();
    const currentState = readSecurityState(normalizedEmail);

    if (
      !currentState ||
      now - currentState.windowStartedAt > ATTEMPT_WINDOW_MS
    ) {
      writeSecurityState(normalizedEmail, {
        failedAttempts: 1,
        windowStartedAt: now,
        lockedUntil: null,
      });
      return;
    }

    const nextState: LoginSecurityState = {
      failedAttempts: currentState.failedAttempts + 1,
      windowStartedAt: currentState.windowStartedAt,
      lockedUntil: currentState.lockedUntil,
    };

    if (nextState.failedAttempts >= 3) {
      nextState.lockedUntil = now + LOCK_DURATION_MS;
      nextState.failedAttempts = 0;
      nextState.windowStartedAt = now;
      setBlockTimeRemaining(LOCK_DURATION_MS);
    }

    writeSecurityState(normalizedEmail, nextState);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (blockTimeRemaining !== null && blockTimeRemaining > 0) {
      setError(
        `Tu cuenta está bloqueada. Espera ${formatRemainingTime(blockTimeRemaining)} antes de intentar de nuevo.`,
      );
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (!hasEnvVars) {
      setError(
        "Faltan las variables de entorno de Supabase. Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
      );
      setIsLoading(false);
      return;
    }

    try {
      const { data: signInData, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });
      if (error) throw error;

      const userId = signInData.user?.id;
      if (!userId) {
        throw new Error("No se pudo identificar el perfil del usuario.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      const dashboardPath = getDashboardPathForRole(profile?.role);
      if (!dashboardPath) {
        throw new Error("No se encontró una ruta disponible para tu rol.");
      }

      if (normalizedEmail) {
        clearSecurityState(normalizedEmail);
      }
      router.replace(dashboardPath);
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (
          error.message.includes("Failed to fetch") ||
          error.message.includes("fetch failed")
        ) {
          setError(
            "No se pudo conectar con Supabase. Verifica la URL y la clave pública del proyecto.",
          );
          return;
        }

        if (error.message.includes("Invalid login credentials")) {
          setError("Correo o contraseña incorrectos");
          if (normalizedEmail) {
            registerFailedAttempt(normalizedEmail);
          }
        } else {
          setError(error.message);
        }
      } else {
        setError("Ocurrió un error inesperado");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="rounded-[24px] bg-white px-6 py-7 shadow-[0_8px_20px_rgba(0,0,0,0.14)] md:px-8 md:py-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Iniciar Sesión
          </h2>
          <p className="text-gray-600 text-sm">Por favor, ingresa tus datos</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {blockTimeRemaining !== null && blockTimeRemaining > 0 && (
            <div className="rounded-md border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-700">
              ⏱️ Tu cuenta está bloqueada por{" "}
              {formatRemainingTime(blockTimeRemaining)} minutos.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 font-medium">
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="nombre@ejemplo.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 font-medium">
              Contraseña
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                disabled={blockTimeRemaining !== null && blockTimeRemaining > 0}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 bg-gray-100 border-gray-300 text-gray-900 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 transition"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            <div className="pt-1 text-right">
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-gray-600 underline-offset-4 hover:text-gray-900 hover:underline"
              >
                Olvidaste tu contraseña
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="border-gray-400"
            />
            <Label
              htmlFor="remember"
              className="cursor-pointer text-sm font-normal text-gray-700"
            >
              Recordar sesión
            </Label>
          </div>

          {error && (
            <p className="text-center text-sm text-red-500 p-3 bg-red-700/10 rounded-md">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={
              isLoading ||
              (blockTimeRemaining !== null && blockTimeRemaining > 0)
            }
            className="h-11 w-full rounded-full bg-[#86cbea] text-lg font-semibold text-gray-900 shadow-[0_10px_22px_-14px_rgba(57,120,150,0.65)] transition hover:bg-[#75c1e5]"
          >
            {blockTimeRemaining !== null && blockTimeRemaining > 0
              ? "Cuenta bloqueada"
              : isLoading
                ? "Iniciando sesión..."
                : "Iniciar Sesión"}
          </Button>

          <div className="text-center text-sm text-gray-700">
            No tienes cuenta?{" "}
            <Link
              href="/auth/sign-up"
              className="font-semibold text-cyan-500 underline underline-offset-4 hover:text-cyan-600"
            >
              Registrate
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
