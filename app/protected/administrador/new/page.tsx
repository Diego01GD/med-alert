import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AddUserForm } from "@/components/admin/add-user-form";
import MiniLogo from "@/components/mini-logo";
import { LogoutButton } from "@/components/logout-button";

export default function NewUserPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(190,224,252,0.95),rgba(237,246,252,1)_40%,rgba(247,250,252,1)_100%)] p-4 sm:p-8">
      <div className="mx-auto w-full ">
        <header className="mb-8 flex items-center justify-between gap-4 rounded-[28px] border border-white/70 bg-white/70 px-5 py-4 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.4)] backdrop-blur-md">
          <MiniLogo />
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-[0.16em] text-slate-900 uppercase md:text-4xl">
              ADMINISTRADOR
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Panel de Administración
            </p>
          </div>
          <LogoutButton className="rounded-2xl border border-slate-300 bg-white/70 hover:bg-white text-slate-900 font-semibold px-6 shadow-sm h-11">
            Cerrar Sesion
          </LogoutButton>
        </header>

        {/* Header */}
        <div className="mb-8">
          <Link href="/protected/administrador">
            <Button
              variant="ghost"
              className="mb-4 gap-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a usuarios
            </Button>
          </Link>

          <div>
            <h1 className="text-3xl font-black text-slate-900">
              Crear nuevo usuario
            </h1>
            <p className="mt-2 text-slate-600">
              Completa el formulario para registrar un nuevo usuario en el
              sistema
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <AddUserForm />
        </div>
      </div>
    </div>
  );
}
