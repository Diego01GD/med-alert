import { redirect } from "next/navigation";
import Link from "next/link";

import {
  getCurrentUserProfile,
  type UserProfile,
} from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import MiniLogo from "@/components/mini-logo";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { Plus, ShieldCheck, UserRound, UsersRound, Pill } from "lucide-react";
import { AdminUsersSection } from "@/components/admin/admin-users-section";
import { RelationsTable } from "@/components/admin/relations-table";

type DashboardRole =
  | "paciente"
  | "medico"
  | "admin"
  | "administrador"
  | "cuidador"
  | "farmaceutico";

type RoleCard = {
  key:
    | "pacientes"
    | "medicos"
    | "cuidador"
    | "farmaceuticos"
    | "administradores";
  label: string;
  roles: DashboardRole[];
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
};

const roleCards: RoleCard[] = [
  {
    key: "pacientes",
    label: "Pacientes",
    roles: ["paciente"],
    accent: "from-sky-100 to-blue-200 border-blue-300",
    icon: UserRound,
  },
  {
    key: "medicos",
    label: "Médicos",
    roles: ["medico"],
    accent: "from-emerald-100 to-green-200 border-green-300",
    icon: ShieldCheck,
  },
  {
    key: "cuidador",
    label: "Cuidadores",
    roles: ["cuidador"],
    accent: "from-violet-100 to-purple-200 border-violet-300",
    icon: UsersRound,
  },
  {
    key: "farmaceuticos",
    label: "Farmacéuticos",
    roles: ["farmaceutico"],
    accent: "from-orange-100 to-amber-200 border-orange-300",
    icon: Pill,
  },
];

export type UserRow = UserProfile & {
  email: string | null;
  created_at: string | null;
};

type RelationUser = {
  id: string;
  role: string | null;
  full_name: string | null;
};

type RelationRow = {
  id: string;
  relation_type: string;
  created_at: string;
  superior: RelationUser | null;
  patient: RelationUser | null;
};

export default async function AdminDashboardPage() {
  const profile = await getCurrentUserProfile();

  if (!profile || !["admin", "administrador"].includes(profile.role ?? "")) {
    redirect("/protected");
  }

  const supabase = await createClient();

  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select("id, role, full_name, phone_number, age, weight")
    .order("full_name", { ascending: true });

  if (usersError) {
    throw usersError;
  }

  const userRows = (users ?? []) as UserProfile[];

  const adminClient = createAdminClient();

  const relationsResult = adminClient
    ? await adminClient
        .from("user_relations")
        .select(
          "id, relation_type, created_at, superior:superior_id(id, full_name, role), patient:patient_id(id, full_name, role)",
        )
        .order("created_at", { ascending: false })
    : null;

  if (relationsResult?.error) {
    throw relationsResult.error;
  }

  const relations: RelationRow[] = (relationsResult?.data ?? []).map((row) => {
    const superiorRaw = row.superior as RelationUser[] | RelationUser | null;
    const patientRaw = row.patient as RelationUser[] | RelationUser | null;

    const superior = Array.isArray(superiorRaw)
      ? (superiorRaw[0] ?? null)
      : superiorRaw;
    const patient = Array.isArray(patientRaw)
      ? (patientRaw[0] ?? null)
      : patientRaw;

    return {
      id: row.id,
      relation_type: row.relation_type,
      created_at: row.created_at,
      superior,
      patient,
    };
  });

  const authUsers = adminClient
    ? await adminClient.auth.admin.listUsers()
    : null;

  const authUsersById = new Map(
    authUsers?.data.users.map((authUser) => [authUser.id, authUser]) ?? [],
  );

  const enrichedUsers: UserRow[] = userRows.map((user) => {
    const authUser = authUsersById.get(user.id);
    return {
      ...user,
      email: authUser?.email ?? null,
      created_at: authUser?.created_at ?? null,
    };
  });

  const userCounts = roleCards.map((card) => ({
    ...card,
    count: userRows.filter((user) =>
      card.roles.includes(user.role as DashboardRole),
    ).length,
  }));

  return (
    <div className="flex min-h-screen w-full flex-col bg-[radial-gradient(circle_at_top_left,rgba(190,224,252,0.95),rgba(237,246,252,1)_40%,rgba(247,250,252,1)_100%)] p-6 md:p-8 lg:p-10">
      <header className="mb-8 flex items-center justify-between gap-4 rounded-[28px] border border-white/70 bg-white/70 px-5 py-4 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.4)] backdrop-blur-md">
        <MiniLogo />
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-[0.16em] text-slate-900 uppercase md:text-4xl">
            ADMINISTRADOR
          </h1>
          <p className="mt-1 text-sm text-slate-600">Panel de Administración</p>
        </div>
        <LogoutButton className="rounded-2xl border border-slate-300 bg-white/70 hover:bg-white text-slate-900 font-semibold px-6 shadow-sm h-11">
          Cerrar Sesion
        </LogoutButton>
      </header>

      <main className="flex flex-1 flex-col gap-8">
        <section className="rounded-[32px] border border-white/70 bg-white/75 p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.35)] md:p-8">
          <h2 className="text-center text-xl font-black text-slate-900">
            Usuarios
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {userCounts.map((card) => (
              <div
                key={card.key}
                className={`rounded-2xl border bg-gradient-to-br ${card.accent} p-5 text-slate-900 shadow-sm`}
              >
                <card.icon className="h-8 w-8 text-slate-900" />
                <p className="mt-3 text-lg font-black">{card.label}</p>
                <p className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                  {card.count.toLocaleString("es-MX")}
                </p>
                <p className="mt-1 text-xs font-medium opacity-80">
                  Usuarios registrados
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/75 p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.35)] md:p-8">
          <AdminUsersSection initialUsers={enrichedUsers} />
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/75 p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.35)] md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Link href="/protected/administrador/relations">
              <Button className="w-fit rounded-xl bg-sky-300 text-slate-900 shadow-sm hover:bg-sky-400">
                <Plus className="h-4 w-4" />
                Añadir relaciones
              </Button>
            </Link>
            <h2 className="text-center text-xl font-black text-slate-900 md:flex-1">
              Sección de Asignaciones
            </h2>
            <div className="hidden md:block md:w-fit" />
          </div>

          <div className="mt-6 rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50/80 p-10">
            <RelationsTable initialRelations={relations} />
          </div>
        </section>
      </main>
    </div>
  );
}
