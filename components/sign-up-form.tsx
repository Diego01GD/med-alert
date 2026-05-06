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
import { useState, useEffect } from "react";
import Logo from "@/components/logo";
import { Eye, EyeOff, Loader2 } from "lucide-react"; // Importamos Loader2

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [isPasswordValid, setIsPasswordValid] = useState(true);
  const [doPasswordsMatch, setDoPasswordsMatch] = useState(true);

  useEffect(() => {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?_&])[A-Za-z\d@$!%*?_&]{8,12}$/;
    setIsPasswordValid(password === "" || regex.test(password));
  }, [password]);

  useEffect(() => {
    setDoPasswordsMatch(repeatPassword === "" || password === repeatPassword);
  }, [password, repeatPassword]);

 const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault();
  const supabase = createClient();
  setIsLoading(true);
  setError(null);

  try {
    // 1. Verificación REAL contra auth.users usando nuestra función RPC
    const { data: emailExists, error: rpcError } = await supabase
      .rpc('check_email_exists', { email_to_check: email });

    if (rpcError) throw new Error("Error al verificar disponibilidad del correo.");

    if (emailExists) {
      throw new Error("Este correo electrónico ya está registrado en MedAlert.");
    }

    // 2. Si no existe, procedemos con el registro
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/protected`,
        data: {
          full_name: `${nombre} ${apellidos}`,
          phone_number: telefono,
          role: "paciente",
        },
      },
    });

    if (signUpError) throw signUpError;

    // 3. Redirección al éxito
    router.push("/auth/sign-up-success");

  } catch (err: any) {
    // Lógica robusta para extraer el mensaje y evitar el "{}"
    let finalMessage = "Ocurrió un error inesperado.";
    
    if (typeof err === "string") finalMessage = err;
    else if (err?.message) finalMessage = err.message;
    else if (err?.error_description) finalMessage = err.error_description;

    setError(finalMessage);
    // console.error("Error en Registro:", finalMessage);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className={cn("flex flex-col items-center justify-center min-h-screen p-4", className)} {...props}>

      <div className="w-full max-w-4xl bg-white/40 backdrop-blur-md rounded-[40px] p-8 shadow-2xl border border-white/20">

        <div className="flex flex-col items-center mb-6">
          <Logo />
        </div>

        <Card className="border-none shadow-none bg-white rounded-[30px] overflow-hidden">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold">Registro</CardTitle>
            <CardDescription className="text-slate-600 max-w-md mx-auto
            ">
              Por favor rellena los campos con los datos solicitados. <br />
              Los campos con * son obligatorios.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                  {/* Inputs de datos personales */}
                  <div className="grid gap-2">
                    <Label htmlFor="nombre" className="font-bold">Nombre*</Label>
                    <Input id="nombre" placeholder="Tu nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="bg-[#edf1f4] h-12 border-none rounded-xl" />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="apellidos" className="font-bold">Apellidos*</Label>
                    <Input id="apellidos" placeholder="Tus apellidos" required value={apellidos} onChange={(e) => setApellidos(e.target.value)} className="bg-[#edf1f4] h-12 border-none rounded-xl" />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email" className="font-bold">Correo electrónico*</Label>
                    <Input id="email" type="email" placeholder="nombre@ejemplo.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-[#edf1f4] h-12 border-none rounded-xl" />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="telefono" className="font-bold">Teléfono*</Label>
                    <div className="flex gap-2">
                      <Input className="w-20" placeholder="+52" disabled />
                      <Input id="telefono" type="tel" placeholder="(999) 999-9999" required value={telefono} onChange={(e) => setTelefono(e.target.value)} className="bg-[#edf1f4] h-12 border-none rounded-xl" />
                    </div>
                  </div>
    
                  {/* Password */}
                  <div className="grid gap-2">
                    <Label htmlFor="password" title="Un símbolo, número y mayúscula obligatorio" className="font-bold">Contraseña*</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="**********"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={cn("h-12 border-none rounded-xl bg-[#edf1f4] pr-10", !isPasswordValid && "ring-2 ring-red-500")}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {!isPasswordValid && (
                      <p className="text-xs text-red-500 font-medium">Debe tener 8-12 caracteres, una mayúscula, un número y un carácter especial.</p>
                    )}
                  </div>
    
                  {/* Confirmar Password */}
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password" className="font-bold">Confirmar Contraseña*</Label>
                    <div className="relative">
                      <Input
                        id="repeat-password"
                        type={showRepeatPassword ? "text" : "password"}
                        placeholder="**********"
                        required
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        className={cn("h-12 bg-[#edf1f4] border-none rounded-xl pr-10", !doPasswordsMatch && "ring-2 ring-red-500")}
                      />
                      <button type="button" onClick={() => setShowRepeatPassword(!showRepeatPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {showRepeatPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {!doPasswordsMatch && <p className="text-xs text-red-500 font-medium">Las contraseñas no coinciden.</p>}
                  </div>
                </div>
  
                <div className="flex items-center gap-3 px-2">
                  <Input id="term-cond" type="checkbox" required checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="w-5 h-5 rounded-md border-slate-300 text-cyan-500 focus:ring-cyan-500" />
                  <Label htmlFor="term-cond" className="text-sm text-slate-600 cursor-pointer">
                    Acepto los <Link href="/terms" className="underline underline-offset-4">términos y condiciones</Link>
                  </Label>
                </div>
  
                {error && <p className="text-sm text-red-500 font-medium bg-red-50 p-2 rounded-xl text-center border border-red-100">{error}</p>}
  
                <div className="flex justify-center pt-2">
                  <Button
                    type="submit"
                    className="w-full lg:w-80 bg-[#A8D8FF] hover:bg-[#8ec7f5] text-black font-bold py-6 rounded-2xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-md"
                    disabled={isLoading || !acceptedTerms || !isPasswordValid || !doPasswordsMatch || password === ""}
                  >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
                  </Button>
                </div>
              </div>
            </form>
            <div className="mt-4 text-center text-sm">
              ¿Ya tienes una cuenta? <Link href="/auth/login" className="font-semibold text-cyan-500 underline underline-offset-4 hover:text-cyan-600">Inicia sesión</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}