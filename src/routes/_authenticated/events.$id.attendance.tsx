import { useMemo } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getEventAttendance, saveAttendance } from "@/lib/band.functions";
import { attendanceStatusSchema, type AttendanceRecord } from "@/lib/band.schemas";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/events/$id/attendance")({
  head: () => ({
    meta: [
      { title: "Catat Kehadiran — Provost Band" },
      { name: "description", content: "Catat kehadiran player pada sesi latihan." },
      { property: "og:title", content: "Catat Kehadiran — Provost Band" },
      { property: "og:description", content: "Catat kehadiran player pada sesi latihan." },
    ],
  }),
  component: AttendancePage,
});

const statusLabels: Record<string, string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  alfa: "Alfa",
};

const statusClasses: Record<string, string> = {
  hadir: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  izin: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  sakit: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  alfa: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

function AttendancePage() {
  const { id } = useParams({ from: "/_authenticated/events/$id/attendance" });
  const queryClient = useQueryClient();
  const fetchAttendance = useServerFn(getEventAttendance);
  const saveAttendanceFn = useServerFn(saveAttendance);

  const { data, isLoading } = useQuery({
    queryKey: ["event-attendance", id],
    queryFn: () => fetchAttendance({ data: { id } }),
  });

  const initialRecords = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const player of data?.players ?? []) {
      const existing = data?.attendances.find((a) => a.player_id === player.id);
      map.set(player.id, {
        player_id: player.id,
        status: (existing?.status as AttendanceRecord["status"]) ?? "hadir",
        note: existing?.note ?? null,
      });
    }
    return map;
  }, [data]);

  const [records, setRecords] = useState(() => initialRecords);

  useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  const saveMutation = useMutation({
    mutationFn: saveAttendanceFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-attendance", id] });
      toast.success("Kehadiran berhasil disimpan");
    },
    onError: () => toast.error("Gagal menyimpan kehadiran"),
  });

  function updateStatus(playerId: string, status: AttendanceRecord["status"]) {
    setRecords((prev) => {
      const next = new Map(prev);
      const current = next.get(playerId);
      if (current) next.set(playerId, { ...current, status });
      return next;
    });
  }

  function handleSave() {
    saveMutation.mutate({
      data: { event_id: id, records: Array.from(records.values()) },
    });
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to="/events" className="rounded-md p-1 hover:bg-accent">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-card-foreground">Catat Kehadiran</h1>
              <p className="text-sm text-muted-foreground">
                {data?.event.name ?? "Memuat..."}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {isLoading ? (
          <p className="text-muted-foreground">Memuat...</p>
        ) : data?.players.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground">
              Tidak ada player aktif. Aktifkan player di menu Data Player.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.players.map((player) => {
              const record = records.get(player.id);
              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                >
                  <div>
                    <h3 className="font-semibold text-card-foreground">{player.name}</h3>
                    {player.nickname && (
                      <p className="text-sm text-muted-foreground">{player.nickname}</p>
                    )}
                  </div>
                  <Select
                    value={record?.status ?? "hadir"}
                    onValueChange={(v) =>
                      updateStatus(player.id, v as AttendanceRecord["status"])
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {attendanceStatusSchema.options.map((status) => (
                        <SelectItem key={status} value={status}>
                          <span className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                status === "hadir"
                                  ? "bg-green-500"
                                  : status === "izin"
                                  ? "bg-amber-500"
                                  : status === "sakit"
                                  ? "bg-blue-500"
                                  : "bg-red-500"
                              }`}
                            />
                            {statusLabels[status]}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

// Missing imports from React
import { useState, useEffect } from "react";
