"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  // 1. Nuevos estados para los campos del diseño
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    try {
      // 2. Enviamos los datos adicionales en el objeto 'data'
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/protected`,
          data: {
            full_name: `${nombre} ${apellidos}`,
            phone_number: telefono,
            role: 'paciente', // Valor por defecto para este formulario
          },
        },
      });

      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-none shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Registro</CardTitle>
          <CardDescription>
            Por favor rellena los campos con los datos solicitados. <br />
            Los campos con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              
              {/* Campo Nombre */}
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre*</Label>
                <Input
                  id="nombre"
                  placeholder="Tu nombre"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              {/* Campo Apellidos */}
              <div className="grid gap-2">
                <Label htmlFor="apellidos">Apellidos*</Label>
                <Input
                  id="apellidos"
                  placeholder="Tus apellidos"
                  required
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                />
              </div>

              {/* Campo Email */}
              <div className="grid gap-2">
                <Label htmlFor="email">Correo electrónico*</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nombre@ejemplo.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Campo Teléfono */}
              <div className="grid gap-2">
                <Label htmlFor="telefono">Teléfono*</Label>
                <div className="flex gap-2">
                  <Input className="w-20" placeholder="+52" disabled />
                  <Input
                    id="telefono"
                    type="tel"
                    placeholder="(999) 999-9999"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>
              </div>

              {/* Campo Password */}
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña*</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Repetir Password */}
              <div className="grid gap-2">
                <Label htmlFor="repeat-password">Confirmar Contraseña*</Label>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

              <Button 
                type="submit" 
                className="w-full bg-[#A8D8FF] hover:bg-[#8ec7f5] text-black font-bold py-6 rounded-2xl transition-all" 
                disabled={isLoading}
              >
                {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </div>
          </form>
          
          <div className="mt-4 text-center text-sm">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/auth/login" className="underline underline-offset-4">
              Inicia sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}