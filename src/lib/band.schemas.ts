import { z } from "zod";

export const playerStatusSchema = z.enum(["active", "inactive"]);
export const eventTypeSchema = z.enum(["latihan", "perform", "kumpul", "lainnya"]);
export const attendanceStatusSchema = z.enum(["hadir", "izin", "sakit", "alfa"]);
export const permissionTypeSchema = z.enum(["izin", "sakit"]);

export const playerSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  nickname: z.string().max(50).optional(),
  phone: z.string().max(30).optional(),
  division: z.string().max(50).optional(),
  instrument: z.string().max(50).optional(),
  status: playerStatusSchema.default("active"),
});

export const eventSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid"),
  event_type: eventTypeSchema.default("latihan"),
  description: z.string().max(500).optional(),
});

export const attendanceRecordSchema = z.object({
  player_id: z.string().uuid(),
  status: attendanceStatusSchema,
  note: z.string().max(200).optional(),
});

export const saveAttendanceSchema = z.object({
  event_id: z.string().uuid(),
  records: z.array(attendanceRecordSchema),
});

export const permissionSchema = z.object({
  player_id: z.string().uuid(),
  permission_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid"),
  type: permissionTypeSchema,
  reason: z.string().max(500).optional(),
});

export const reportRangeSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type PlayerForm = z.infer<typeof playerSchema>;
export type EventForm = z.infer<typeof eventSchema>;
export type PermissionForm = z.infer<typeof permissionSchema>;
export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;
