"use client";

import type { ReactNode } from "react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type LogoutButtonProps = {
  className?: string;
  children?: ReactNode;
};

export function LogoutButton({
  className,
  children = "Cerrar Sesion",
}: LogoutButtonProps) {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/auth/login");
    router.refresh();
  };

  return (
    <Button onClick={logout} className={className}>
      {children}
    </Button>
  );
}
