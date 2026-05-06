"use client";

// import { cn } from "@/lib/utils";
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
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function ForgotPasswordForm() {
  const [step, setStep] = useState(1); // 1: Email, 2: Questions, 3: Success
  const [email, setEmail] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  // PASO 1: Verificar email y obtener sus preguntas
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Primero verificamos si el email existe
      const { data: emailExists, error: checkError } = await supabase.rpc(
        "check_email_exists",
        { email_to_check: email },
      );

      if (checkError) throw checkError;

      if (!emailExists) {
        throw new Error("Este correo no está registrado en nuestro sistema.");
      }

      // Si el email existe, obtenemos sus preguntas de seguridad
      const { data: userQuestions, error: rpcError } = await supabase.rpc(
        "get_user_questions_by_email",
        { p_email: email },
      );

      if (rpcError) throw rpcError;

      // Si el email existe pero no tiene preguntas de seguridad
      if (!userQuestions || userQuestions.length === 0) {
        throw new Error(
          "Tu cuenta no tiene preguntas de seguridad configuradas. Contacta con soporte.",
        );
      }

      setQuestions(userQuestions);
      setStep(2); // Pasamos a las preguntas de seguridad
    } catch (err: any) {
      setError(err?.message || "Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  // PASO 2: Verificar respuestas y enviar correo
  const handleVerifyAndSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formattedAnswers = Object.entries(answers).map(([id, answer]) => ({
      id: parseInt(id),
      answer: answer,
    }));

    try {
      const { data: isCorrect, error: verifyError } = await supabase.rpc(
        "verify_security_questions_and_send_reset",
        { user_email: email, answers: formattedAnswers },
      );

      if (!isCorrect) throw new Error("Las respuestas son incorrectas.");

      // Si son correctas, ahora sí disparamos el proceso oficial de Supabase
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/update-password`,
        },
      );

      if (resetError) throw resetError;
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-none shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Recuperar Contraseña
          </CardTitle>
          <CardDescription>
            {step === 1 && "Ingresa tu correo para comenzar."}
            {step === 2 && "Responde tus preguntas de seguridad."}
            {step === 3 && "¡Listo! Revisa tu bandeja de entrada."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <form onSubmit={handleCheckEmail} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#edf1f4]"
                />
              </div>
              {error && (
                <p className="text-xs text-red-500 bg-red-50 p-2 rounded">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="w-full bg-[#A8D8FF] text-black"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Verificar Email"
                )}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyAndSend} className="space-y-4">
              {questions.map((q: any) => (
                <div key={q.question_id} className="grid gap-2">
                  <Label className="text-xs">{q.question_text}</Label>
                  <Input
                    required
                    onChange={(e) =>
                      setAnswers({
                        ...answers,
                        [q.question_id]: e.target.value,
                      })
                    }
                    className="bg-[#edf1f4]"
                  />
                </div>
              ))}
              {error && (
                <p className="text-xs text-red-500 bg-red-50 p-2 rounded">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="w-full bg-[#A8D8FF] text-black"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Enviar enlace de recuperación"
                )}
              </Button>
            </form>
          )}

          {step === 3 && (
            <p className="text-sm text-center text-muted-foreground">
              Se han enviado las instrucciones a <strong>{email}</strong>.
            </p>
          )}

          <div className="mt-4 text-center text-sm">
            <Link href="/auth/login" className="underline">
              Volver al login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
