"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from  "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      router.push("/protected");
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes("Invalid login credentials")) {
          setError("Correo o contraseña incorrectos");
        }else {
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Iniciar Sesión</h2>
          <p className="text-gray-600 text-sm">Por favor, ingresa tus datos</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 bg-gray-100 border-gray-300 text-gray-900 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 transition"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff />
                ) : (
                  <Eye />
                )}
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
            <Label htmlFor="remember" className="cursor-pointer text-sm font-normal text-gray-700">
              Recordar sesión
            </Label>
          </div>

          {error && <p className="text-center text-sm text-red-500 p-3 bg-red-700/10 rounded-md">{error}</p>}

          <Button
            type="submit"
            disabled={isLoading}
            className="h-11 w-full rounded-full bg-[#86cbea] text-lg font-semibold text-gray-900 shadow-[0_10px_22px_-14px_rgba(57,120,150,0.65)] transition hover:bg-[#75c1e5]"
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
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
