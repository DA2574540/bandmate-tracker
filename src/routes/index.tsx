import { createFileRoute, Link } from "@tanstack/react-router";
import { Drum, ClipboardCheck, ShieldCheck, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Provost Band — Absensi & Izin Player" },
      { name: "description", content: "Aplikasi provost untuk mencatat kehadiran dan perizinan player marching band." },
      { property: "og:title", content: "Provost Band — Absensi & Izin Player" },
      { property: "og:description", content: "Aplikasi provost untuk mencatat kehadiran dan perizinan player marching band." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Drum className="h-5 w-5" />
            </div>
            <span className="font-semibold tracking-tight text-foreground">Provost Band</span>
          </div>
          <Link
            to="/auth"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Masuk
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <div className="mx-auto max-w-2xl space-y-6">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Catat Kehadiran & Izin Player dengan Tertib
          </h1>
          <p className="text-lg text-muted-foreground">
            Dibangun khusus untuk provost marching band. Kelola data player,
            jadwal latihan, absensi cepat, dan rekap kehadiran dalam satu aplikasi.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Mulai Sekarang
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
          <FeatureCard
            icon={<ClipboardCheck className="h-6 w-6" />}
            title="Absensi Cepat"
            description="Tandai hadir, izin, sakit, atau alfa dalam satu sentuhan saat latihan."
          />
          <FeatureCard
            icon={<Users className="h-6 w-6" />}
            title="Data Player"
            description="Simpan nama, divisi, instrumen, dan kontak player secara terpusat."
          />
          <FeatureCard
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Rekap Tertib"
            description="Lihat persentase kehadiran per player dan periode dengan mudah."
          />
        </div>
      </main>

      <footer className="border-t border-border px-4 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Provost Band. Dibuat untuk membantu provost marching band.
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 text-left shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold text-card-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
