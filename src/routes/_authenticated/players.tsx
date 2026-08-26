import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, ArrowLeft, Users } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPlayers, createPlayer, updatePlayer, deletePlayer } from "@/lib/band.functions";
import { playerSchema, type PlayerForm } from "@/lib/band.schemas";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/players")({
  head: () => ({
    meta: [
      { title: "Data Player — Provost Band" },
      { name: "description", content: "Kelola data player marching band." },
      { property: "og:title", content: "Data Player — Provost Band" },
      { property: "og:description", content: "Kelola data player marching band." },
    ],
  }),
  component: PlayersPage,
});

function PlayersPage() {
  const queryClient = useQueryClient();
  const fetchPlayers = useServerFn(getPlayers);
  const createPlayerFn = useServerFn(createPlayer);
  const updatePlayerFn = useServerFn(updatePlayer);
  const deletePlayerFn = useServerFn(deletePlayer);

  const { data: players = [], isLoading } = useQuery({
    queryKey: ["players"],
    queryFn: () => fetchPlayers(),
  });

  const [editing, setEditing] = useState<PlayerForm & { id: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: createPlayerFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      setIsOpen(false);
      toast.success("Player berhasil ditambahkan");
    },
    onError: () => toast.error("Gagal menambahkan player"),
  });

  const updateMutation = useMutation({
    mutationFn: updatePlayerFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      setEditing(null);
      toast.success("Player berhasil diperbarui");
    },
    onError: () => toast.error("Gagal memperbarui player"),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePlayerFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast.success("Player berhasil dihapus");
    },
    onError: () => toast.error("Gagal menghapus player"),
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
              <h1 className="text-lg font-semibold text-card-foreground">Data Player</h1>
              <p className="text-sm text-muted-foreground">Kelola anggota band</p>
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
                <DialogTitle>Tambah Player</DialogTitle>
              </DialogHeader>
              <PlayerForm
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
        ) : players.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">Belum ada player. Tambah player pertama.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-card-foreground">{player.name}</h3>
                    {player.nickname && (
                      <p className="text-sm text-muted-foreground">{player.nickname}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        setEditing({
                          id: player.id,
                          name: player.name,
                          nickname: player.nickname,
                          phone: player.phone,
                          division: player.division,
                          instrument: player.instrument,
                          status: player.status as PlayerForm["status"],
                        })
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteMutation.mutate({ data: { id: player.id } })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  {player.division && (
                    <p className="text-muted-foreground">Divisi: {player.division}</p>
                  )}
                  {player.instrument && (
                    <p className="text-muted-foreground">Instrumen: {player.instrument}</p>
                  )}
                  {player.phone && (
                    <p className="text-muted-foreground">{player.phone}</p>
                  )}
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      player.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {player.status === "active" ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
          </DialogHeader>
          {editing && (
            <PlayerForm
              defaultValues={editing}
              onSubmit={(data) => updateMutation.mutate({ data: { ...data, id: editing.id } })}
              submitLabel="Perbarui"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlayerForm({
  defaultValues,
  onSubmit,
  submitLabel,
}: {
  defaultValues?: PlayerForm;
  onSubmit: (data: PlayerForm) => void;
  submitLabel: string;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PlayerForm>({
    resolver: zodResolver(playerSchema),
    defaultValues: defaultValues ?? {
      name: "",
      nickname: null,
      phone: null,
      division: null,
      instrument: null,
      status: "active",
    },
  });

  const status = watch("status");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Nama Lengkap</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="nickname">Nama Panggilan</Label>
        <Input id="nickname" {...register("nickname")} />
      </div>
      <div>
        <Label htmlFor="division">Divisi</Label>
        <Input id="division" {...register("division")} placeholder="Contoh: Brass, Percussion" />
      </div>
      <div>
        <Label htmlFor="instrument">Instrumen</Label>
        <Input id="instrument" {...register("instrument")} placeholder="Contoh: Trumpet, Snare" />
      </div>
      <div>
        <Label htmlFor="phone">Nomor HP</Label>
        <Input id="phone" {...register("phone")} />
      </div>
      <div>
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => setValue("status", v as PlayerForm["status"])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
