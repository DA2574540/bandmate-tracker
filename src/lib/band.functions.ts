import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  playerSchema,
  eventSchema,
  saveAttendanceSchema,
  permissionSchema,
  reportRangeSchema,
} from "./band.schemas";

export const getPlayers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("players")
      .select("*")
      .eq("user_id", context.userId)
      .order("name", { ascending: true });

    if (error) throw error;
    return data ?? [];
  });

export const createPlayer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => playerSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { data: result, error } = await context.supabase
      .from("players")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();

    if (error) throw error;
    return result;
  });

export const updatePlayer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({ id: z.string().uuid(), ...playerSchema.shape })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { id, ...rest } = data;
    const { data: result, error } = await context.supabase
      .from("players")
      .update(rest)
      .eq("id", id)
      .eq("user_id", context.userId)
      .select()
      .single();

    if (error) throw error;
    return result;
  });

export const deletePlayer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("players")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);

    if (error) throw error;
    return { ok: true };
  });

export const getEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("events")
      .select("*")
      .eq("user_id", context.userId)
      .order("event_date", { ascending: false });

    if (error) throw error;
    return data ?? [];
  });

export const createEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => eventSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { data: result, error } = await context.supabase
      .from("events")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();

    if (error) throw error;
    return result;
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("events")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);

    if (error) throw error;
    return { ok: true };
  });

export const getEventAttendance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { id } = data;

    const [eventResult, playersResult, attendanceResult] = await Promise.all([
      context.supabase.from("events").select("*").eq("id", id).eq("user_id", context.userId).single(),
      context.supabase
        .from("players")
        .select("*")
        .eq("user_id", context.userId)
        .eq("status", "active")
        .order("name", { ascending: true }),
      context.supabase.from("attendances").select("*").eq("event_id", id).eq("user_id", context.userId),
    ]);

    if (eventResult.error) throw eventResult.error;
    if (playersResult.error) throw playersResult.error;
    if (attendanceResult.error) throw attendanceResult.error;

    return {
      event: eventResult.data,
      players: playersResult.data ?? [],
      attendances: attendanceResult.data ?? [],
    };
  });

export const saveAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => saveAttendanceSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { event_id, records } = data;

    const rows = records.map((record) => ({
      event_id,
      player_id: record.player_id,
      status: record.status,
      note: record.note,
      user_id: context.userId,
    }));

    const { error } = await context.supabase.from("attendances").upsert(rows, {
      onConflict: "event_id,player_id",
    });

    if (error) throw error;
    return { ok: true };
  });

export const getPermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("permissions")
      .select("*, players(name, nickname)")
      .eq("user_id", context.userId)
      .order("permission_date", { ascending: false });

    if (error) throw error;
    return data ?? [];
  });

export const createPermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => permissionSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { data: result, error } = await context.supabase
      .from("permissions")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();

    if (error) throw error;
    return result;
  });

export const deletePermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("permissions")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);

    if (error) throw error;
    return { ok: true };
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().split("T")[0];

    const [playersResult, eventsResult, todayEventsResult] = await Promise.all([
      context.supabase.from("players").select("id", { count: "exact" }).eq("user_id", context.userId),
      context.supabase.from("events").select("id", { count: "exact" }).eq("user_id", context.userId),
      context.supabase
        .from("events")
        .select("*")
        .eq("user_id", context.userId)
        .eq("event_date", today)
        .order("name", { ascending: true }),
    ]);

    if (playersResult.error) throw playersResult.error;
    if (eventsResult.error) throw eventsResult.error;
    if (todayEventsResult.error) throw todayEventsResult.error;

    const todayEventIds = todayEventsResult.data?.map((e) => e.id) ?? [];

    let attendanceResult = { data: [] as { status: string }[], error: null };
    if (todayEventIds.length > 0) {
      const res = await context.supabase
        .from("attendances")
        .select("status")
        .eq("user_id", context.userId)
        .in("event_id", todayEventIds);
      attendanceResult = res as typeof attendanceResult;
      if (attendanceResult.error) throw attendanceResult.error;
    }

    const hadir = attendanceResult.data?.filter((a) => a.status === "hadir").length ?? 0;
    const izinSakit =
      attendanceResult.data?.filter((a) => a.status === "izin" || a.status === "sakit").length ?? 0;

    return {
      totalPlayers: playersResult.count ?? 0,
      totalEvents: eventsResult.count ?? 0,
      todayEvents: todayEventsResult.data ?? [],
      todayAttendance: { hadir, izinSakit, total: attendanceResult.data?.length ?? 0 },
    };
  });

export const getAttendanceReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => reportRangeSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { start_date, end_date } = data;

    const [playersResult, eventsResult, attendanceResult] = await Promise.all([
      context.supabase
        .from("players")
        .select("id, name, nickname")
        .eq("user_id", context.userId)
        .eq("status", "active")
        .order("name", { ascending: true }),
      context.supabase
        .from("events")
        .select("id, event_date")
        .eq("user_id", context.userId)
        .gte("event_date", start_date)
        .lte("event_date", end_date)
        .order("event_date", { ascending: true }),
      context.supabase
        .from("attendances")
        .select("player_id, event_id, status")
        .eq("user_id", context.userId),
    ]);

    if (playersResult.error) throw playersResult.error;
    if (eventsResult.error) throw eventsResult.error;
    if (attendanceResult.error) throw attendanceResult.error;

    const eventIds = new Set(eventsResult.data?.map((e) => e.id) ?? []);
    const totalEvents = eventIds.size;

    const attendanceByPlayer = new Map<string, { hadir: number; izin: number; sakit: number; alfa: number }>();
    for (const record of attendanceResult.data ?? []) {
      if (!eventIds.has(record.event_id)) continue;
      const map = attendanceByPlayer.get(record.player_id) ?? {
        hadir: 0,
        izin: 0,
        sakit: 0,
        alfa: 0,
      };
      map[record.status as keyof typeof map] = (map[record.status as keyof typeof map] ?? 0) + 1;
      attendanceByPlayer.set(record.player_id, map);
    }

    const report =
      playersResult.data?.map((player) => {
        const counts = attendanceByPlayer.get(player.id) ?? {
          hadir: 0,
          izin: 0,
          sakit: 0,
          alfa: 0,
        };
        const attended = counts.hadir;
        const rate = totalEvents > 0 ? Math.round((attended / totalEvents) * 100) : 0;
        return {
          ...player,
          counts,
          totalEvents,
          rate,
        };
      }) ?? [];

    return { report, totalEvents };
  });
