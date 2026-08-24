import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAttendanceReport } from "@/lib/band.functions";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Rekap Kehadiran — Provost Band" },
      { name: "description", content: "Lihat rekap kehadiran player per periode." },
      { property: "og:title", content: "Rekap Kehadiran — Provost Band" },
      { property: "og:description", content: "Lihat rekap kehadiran player per periode." },
    ],
  }),
  component: ReportsPage,
});

const statusLabels: Record<string, string> = {
  hadir: "H",
  izin: "I",
  sakit: "S",
  alfa: "A",
};

function ReportsPage() {
  const fetchReport = useServerFn(getAttendanceReport);

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["attendance-report", startDate, endDate],
    queryFn: () => fetchReport({ data: { start_date: startDate, end_date: endDate } }),
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="rounded-md p-1 hover:bg-accent">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-card-foreground">Rekap Kehadiran</h1>
              <p className="text-sm text-muted-foreground">Persentase kehadiran player</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="start_date">Dari</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end_date">Sampai</Label>
              <Input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => refetch()} className="w-full">
                Tampilkan
              </Button>
            </div>
          </div>
        </section>

        {isLoading ? (
          <p className="text-muted-foreground">Memuat...</p>
        ) : data?.report.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">Tidak ada data kehadiran di periode ini.</p>
          </div>
        ) : (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-card-foreground">Ringkasan</h2>
              <p className="text-sm text-muted-foreground">
                Total sesi: {data?.totalEvents ?? 0}
              </p>
            </div>
            <div className="grid gap-3">
              {data?.report.map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-card-foreground">{row.name}</h3>
                      {row.nickname && (
                        <p className="text-sm text-muted-foreground">{row.nickname}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-card-foreground">{row.rate}%</p>
                      <p className="text-xs text-muted-foreground">kehadiran</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {Object.entries(row.counts).map(([status, count]) => (
                      <div
                        key={status}
                        className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
                      >
                        <span>{statusLabels[status]}</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
