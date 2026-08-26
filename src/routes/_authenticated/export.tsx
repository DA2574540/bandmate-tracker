import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { getExportData } from "@/lib/band.functions";

export const Route = createFileRoute("/_authenticated/export")({
  head: () => ({
    meta: [
      { title: "Ekspor Excel — Provost Band" },
      { name: "description", content: "Unduh seluruh data player, jadwal, kehadiran, dan izin dalam satu file Excel." },
      { property: "og:title", content: "Ekspor Excel — Provost Band" },
      { property: "og:description", content: "Unduh seluruh data band dalam satu file Excel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExportPage,
});

const statusLabel: Record<string, string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  alfa: "Alfa",
};

function ExportPage() {
  const fetchExport = useServerFn(getExportData);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const data = await fetchExport({});
      const playerName = new Map(data.players.map((p) => [p.id, p.name]));
      const eventName = new Map(data.events.map((e) => [e.id, e.name]));
      const eventDate = new Map(data.events.map((e) => [e.id, e.event_date]));

      const wb = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          data.players.map((p) => ({
            Nama: p.name,
            Panggilan: p.nickname ?? "",
            "No. HP": p.phone ?? "",
            Divisi: p.division ?? "",
            Alat: p.instrument ?? "",
            Status: p.status === "active" ? "Aktif" : "Nonaktif",
          })),
        ),
        "Data Player",
      );

      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          data.events.map((e) => ({
            Tanggal: e.event_date,
            Kegiatan: e.name,
            Jenis: e.event_type,
            Keterangan: e.description ?? "",
          })),
        ),
        "Jadwal Kegiatan",
      );

      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          data.attendances.map((a) => ({
            Tanggal: eventDate.get(a.event_id) ?? "",
            Kegiatan: eventName.get(a.event_id) ?? "",
            Player: playerName.get(a.player_id) ?? "",
            Status: statusLabel[a.status] ?? a.status,
            Catatan: a.note ?? "",
          })),
        ),
        "Kehadiran",
      );

      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          data.permissions.map((p) => ({
            Tanggal: p.permission_date,
            Player: playerName.get(p.player_id) ?? "",
            Jenis: statusLabel[p.type] ?? p.type,
            Alasan: p.reason ?? "",
          })),
        ),
        "Perizinan",
      );

      const rekap = data.players.map((p) => {
        const rows = data.attendances.filter((a) => a.player_id === p.id);
        const count = (s: string) => rows.filter((a) => a.status === s).length;
        const total = rows.length;
        return {
          Player: p.name,
          Hadir: count("hadir"),
          Izin: count("izin"),
          Sakit: count("sakit"),
          Alfa: count("alfa"),
          "Total Sesi": total,
          "Persentase Hadir": total > 0 ? `${Math.round((count("hadir") / total) * 100)}%` : "0%",
        };
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rekap), "Rekap");

      const stamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `data-band-${stamp}.xlsx`);
      toast.success("File Excel berhasil diunduh");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengekspor data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
          <Link to="/dashboard" className="rounded-md p-1 hover:bg-accent">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-card-foreground">Ekspor Excel</h1>
            <p className="text-sm text-muted-foreground">Semua data dalam satu file</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold text-card-foreground">Unduh data lengkap</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            File Excel akan berisi 5 sheet: Data Player, Jadwal Kegiatan, Kehadiran, Perizinan, dan Rekap
            persentase kehadiran.
          </p>
          <Button className="mt-5 w-full sm:w-auto" onClick={handleExport} disabled={loading}>
            <Download className="mr-2 h-4 w-4" />
            {loading ? "Menyiapkan file..." : "Unduh Excel"}
          </Button>
        </section>
      </main>
    </div>
  );
}
