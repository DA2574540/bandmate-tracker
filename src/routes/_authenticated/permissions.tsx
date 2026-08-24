import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPermissions, getPlayers, createPermission, deletePermission } from "@/lib/band.functions";
import { permissionSchema, type PermissionForm } from "@/lib/band.schemas";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/permissions")({
  head: () => ({
    meta: [
      { title: "Catat Izin — Provost Band" },
      { name: "description", content: "Catat perizinan dan keterangan sakit player." },
      { property: "og:title", content: "Catat Izin — Provost Band" },
      { property: "og:description", content: "Catat perizinan dan keterangan sakit player." },
    ],
  }),
  component: PermissionsPage,
});

const typeLabels: Record<string, string> = {
  izin: "Izin",
  sakit: "Sakit",
};

function PermissionsPage() {
  const queryClient = useQueryClient();
  const fetchPermissions = useServerFn(getPermissions);
  const fetchPlayers = useServerFn(getPlayers);
  const createPermissionFn = useServerFn(createPermission);
  const deletePermissionFn = useServerFn(deletePermission);

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => fetchPermissions(),
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: () => fetchPlayers(),
  });

  const [isOpen, setIsOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: createPermissionFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      setIsOpen(false);
      toast.success("Izin berhasil dicatat");
    },
    onError: () => toast.error("Gagal mencatat izin"),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePermissionFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      toast.success("Izin berhasil dihapus");
    },
    onError: () => toast.error("Gagal menghapus izin"),
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
              <h1 className="text-lg font-semibold text-card-foreground">Catat Izin</h1>
              <p className="text-sm text-muted-foreground">Izin dan keterangan sakit</p>
            </div>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Tambah
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Izin/Sakit</DialogTitle>
              </DialogHeader>
              <PermissionForm
                players={players}
                onSubmit={(data) => createMutation.mutate({ data })}
                submitLabel="Simpan"
              />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {isLoading ? (
          <p className="text-muted-foreground">Memuat...</p>
        ) : permissions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">Belum ada catatan izin.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {permissions.map((permission) => {
              const player = permission.players as { name: string; nickname: string | null } | null;
              return (
                <div
                  key={permission.id}
                  className="flex items-start justify-between rounded-xl border border-border bg-card p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-card-foreground">
                        {player?.name ?? "Player"}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          permission.type === "izin"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        }`}
                      >
                        {typeLabels[permission.type]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(permission.permission_date).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    {permission.reason && (
                      <p className="mt-1 text-sm text-muted-foreground">{permission.reason}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteMutation.mutate({ data: { id: permission.id } })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function PermissionForm({
  players,
  onSubmit,
  submitLabel,
}: {
  players: { id: string; name: string }[];
  onSubmit: (data: PermissionForm) => void;
  submitLabel: string;
}) {
  const today = new Date().toISOString().split("T")[0];
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PermissionForm>({
    resolver: zodResolver(permissionSchema),
    defaultValues: { permission_date: today, type: "izin" },
  });

  const type = watch("type");
  const playerId = watch("player_id");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Player</Label>
        <Select value={playerId} onValueChange={(v) => setValue("player_id", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih player" />
          </SelectTrigger>
          <SelectContent>
            {players.map((player) => (
              <SelectItem key={player.id} value={player.id}>
                {player.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.player_id && (
          <p className="text-sm text-destructive">{errors.player_id.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="permission_date">Tanggal</Label>
        <Input id="permission_date" type="date" {...register("permission_date")} />
        {errors.permission_date && (
          <p className="text-sm text-destructive">{errors.permission_date.message}</p>
        )}
      </div>
      <div>
        <Label>Jenis</Label>
        <Select value={type} onValueChange={(v) => setValue("type", v as PermissionForm["type"])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="izin">Izin</SelectItem>
            <SelectItem value="sakit">Sakit</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="reason">Alasan/Keterangan</Label>
        <Textarea id="reason" {...register("reason")} rows={3} />
      </div>
      <Button type="submit" className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
