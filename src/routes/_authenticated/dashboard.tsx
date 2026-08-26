import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Users,
  CalendarDays,
  ClipboardCheck,
  ShieldAlert,
  ChevronRight,
  FileText,
} from "lucide-react";
import { getDashboardStats } from "@/lib/band.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Provost Band" },
      { name: "description", content: "Dashboard ringkasan kehadiran dan izin player." },
      { property: "og:title", content: "Dashboard — Provost Band" },
      { property: "og:description", content: "Dashboard ringkasan kehadiran dan izin player." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const fetchStats = useServerFn(getDashboardStats);
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetchStats(),
  });

  const todayEventCount = stats?.todayEvents.length ?? 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold text-card-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Ringkasan hari ini</p>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Player"
            value={isLoading ? "—" : String(stats?.totalPlayers ?? 0)}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            label="Latihan Hari Ini"
            value={isLoading ? "—" : String(todayEventCount)}
            icon={<CalendarDays className="h-5 w-5" />}
          />
          <StatCard
            label="Hadir"
            value={isLoading ? "—" : String(stats?.todayAttendance.hadir ?? 0)}
            icon={<ClipboardCheck className="h-5 w-5" />}
          />
          <StatCard
            label="Izin/Sakit"
            value={isLoading ? "—" : String(stats?.todayAttendance.izinSakit ?? 0)}
            icon={<ShieldAlert className="h-5 w-5" />}
          />
        </section>

        {todayEventCount > 0 && (
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 font-semibold text-card-foreground">Jadwal Hari Ini</h2>
            <ul className="space-y-2">
              {stats?.todayEvents.map((event) => (
                <li key={event.id}>
                  <Link
                    to="/events/$id/attendance"
                    params={{ id: event.id }}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-accent"
                  >
                    <div>
                      <p className="font-medium text-card-foreground">{event.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{event.event_type}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ActionCard
            to="/players"
            title="Data Player"
            description="Tambah, edit, dan kelola data player."
            icon={<Users className="h-5 w-5" />}
          />
          <ActionCard
            to="/events"
            title="Jadwal Latihan"
            description="Buat sesi latihan dan lihat daftarnya."
            icon={<CalendarDays className="h-5 w-5" />}
          />
          <ActionCard
            to="/permissions"
            title="Catat Izin"
            description="Catat player izin atau sakit manual."
            icon={<FileText className="h-5 w-5" />}
          />
          <ActionCard
            to="/reports"
            title="Rekap Kehadiran"
            description="Lihat persentase kehadiran per periode."
            icon={<ClipboardCheck className="h-5 w-5" />}
          />
        </section>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
        {icon}
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-card-foreground">{value}</p>
    </div>
  );
}

function ActionCard({
  to,
  title,
  description,
  icon,
}: {
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group flex items-start justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-card/80"
    >
      <div>
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          {icon}
        </div>
        <h3 className="font-semibold text-card-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="mt-1 h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function SignOutButton() {
  return (
    <button
      onClick={async () => {
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.auth.signOut();
      }}
      className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
    >
      Keluar
    </button>
  );
}
