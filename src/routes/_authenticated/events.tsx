import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, ArrowLeft, CalendarDays, ClipboardCheck } from "lucide-react";
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
import { getEvents, createEvent, deleteEvent } from "@/lib/band.functions";
import { eventSchema, type EventForm } from "@/lib/band.schemas";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({
    meta: [
      { title: "Jadwal Latihan — Provost Band" },
      { name: "description", content: "Kelola jadwal latihan dan perform marching band." },
      { property: "og:title", content: "Jadwal Latihan — Provost Band" },
      { property: "og:description", content: "Kelola jadwal latihan dan perform marching band." },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const queryClient = useQueryClient();
  const fetchEvents = useServerFn(getEvents);
  const createEventFn = useServerFn(createEvent);
  const deleteEventFn = useServerFn(deleteEvent);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => fetchEvents(),
  });

  const [isOpen, setIsOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: createEventFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setIsOpen(false);
      toast.success("Jadwal berhasil dibuat");
    },
    onError: () => toast.error("Gagal membuat jadwal"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEventFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Jadwal berhasil dihapus");
    },
    onError: () => toast.error("Gagal menghapus jadwal"),
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
              <h1 className="text-lg font-semibold text-card-foreground">Jadwal Latihan</h1>
              <p className="text-sm text-muted-foreground">Buat dan kelola sesi</p>
            </div>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Buat Jadwal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat Jadwal Baru</DialogTitle>
              </DialogHeader>
              <EventForm
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
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">Belum ada jadwal. Buat jadwal pertama.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex flex-col rounded-xl border border-border bg-card p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground capitalize">
                      {event.event_type}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteMutation.mutate({ data: { id: event.id } })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <h3 className="mt-2 font-semibold text-card-foreground">{event.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.event_date).toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  {event.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
                  )}
                </div>
                <Link
                  to="/events/$id/attendance"
                  params={{ id: event.id }}
                  className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Catat Kehadiran
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EventForm({
  defaultValues,
  onSubmit,
  submitLabel,
}: {
  defaultValues?: EventForm;
  onSubmit: (data: EventForm) => void;
  submitLabel: string;
}) {
  const today = new Date().toISOString().split("T")[0];
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: defaultValues ?? { event_date: today, event_type: "latihan" },
  });

  const eventType = watch("event_type");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Nama Sesi</Label>
        <Input id="name" {...register("name")} placeholder="Contoh: Latihan Rutin Mingguan" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="event_date">Tanggal</Label>
        <Input id="event_date" type="date" {...register("event_date")} />
        {errors.event_date && (
          <p className="text-sm text-destructive">{errors.event_date.message}</p>
        )}
      </div>
      <div>
        <Label>Jenis</Label>
        <Select
          value={eventType}
          onValueChange={(v) => setValue("event_type", v as EventForm["event_type"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latihan">Latihan</SelectItem>
            <SelectItem value="perform">Perform</SelectItem>
            <SelectItem value="kumpul">Kumpul</SelectItem>
            <SelectItem value="lainnya">Lainnya</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="description">Keterangan</Label>
        <Textarea id="description" {...register("description")} rows={3} />
      </div>
      <Button type="submit" className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
