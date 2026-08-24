# Rencana Aplikasi Provost Marching Band

## Tujuan
Membangun website ringan dan cepat untuk provost mencatat kehadiran player, mengelola data player, mencatat izin, dan melihat rekap kehadiran.

## Fitur Utama
1. **Autentikasi provost** — login email/password dan Google (hanya Anda yang akses).
2. **Dashboard** — ringkasan hari ini, total player, kehadiran terakhir, dan tombol aksi cepat.
3. **Data Player** — daftar player dengan nama, nomor, posisi/divisi, dan status aktif.
4. **Jadwal Latihan** — buat sesi latihan/event dengan tanggal dan keterangan.
5. **Absensi Cepat** — pilih sesi latihan, tandai player hadir, izin, sakit, atau alfa.
6. **Catat Izin Manual** — provost mencatat player yang izin/sakit di luar sesi latihan.
7. **Rekap Kehadiran** — ringkasan per bulan/tahun dengan persentase kehadiran per player.

## Desain
Tampilan mobile-first karena akan sering dipakai di HP saat latihan. Warna menggunakan palet gelap dengan aksen emas/maroon yang cocok untuk dunia marching band. Dashboard sebagai halaman utama dengan akses cepat ke daftar absen.

## Struktur Database
- `profiles` — data user provost.
- `players` — data player (nama, kontak, divisi, status).
- `events` — sesi latihan/event.
- `attendances` — catatan kehadiran per player per event.
- `permissions` — catatan izin/sakit manual.

## Halaman
- `/` — Dashboard ringkasan.
- `/players` — Kelola player.
- `/events` — Kelola jadwal latihan.
- `/events/$id/attendance` — Absensi untuk satu sesi.
- `/permissions` — Catat dan lihat izin manual.
- `/reports` — Rekap kehadiran.
- `/auth` — Login.

## Implementasi
Menggunakan TanStack Start, React, Tailwind CSS, dan Lovable Cloud (Supabase) untuk database dan autentikasi. Semua data dilindungi Row Level Security agar hanya provost yang bisa mengakses.
