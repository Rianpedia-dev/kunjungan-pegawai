import { z } from "zod";

export const kunjunganSchema = z.object({
  nama_pengunjung: z
    .string()
    .trim()
    .min(3, { message: "Nama pengunjung minimal 3 karakter" })
    .max(100, { message: "Nama pengunjung maksimal 100 karakter" }),
  no_kontak: z
    .string()
    .trim()
    .min(9, { message: "Nomor kontak minimal 9 digit" })
    .max(20, { message: "Nomor kontak maksimal 20 digit" })
    .regex(/^[0-9+-\s]+$/, { message: "Nomor kontak hanya boleh berisi angka, tanda +, atau -" }),
  instansi: z
    .string()
    .trim()
    .min(2, { message: "Asal instansi / pribadi minimal 2 karakter" })
    .max(100, { message: "Nama instansi terlalu panjang" }),
  pegawai_tujuan: z
    .string()
    .trim()
    .min(2, { message: "Pegawai tujuan wajib dipilih atau diisi" }),
  divisi_tujuan: z.string().trim().optional().nullable(),
  keperluan: z
    .string()
    .trim()
    .min(5, { message: "Keperluan kunjungan minimal 5 karakter" })
    .max(500, { message: "Keperluan kunjungan maksimal 500 karakter" }),
  tanggal_kunjungan: z
    .string()
    .min(1, { message: "Tanggal kunjungan wajib ditentukan" }),
  jam_rencana: z.string().optional().nullable(),
  jumlah_tamu: z
    .number()
    .int({ message: "Jumlah tamu harus berupa bilangan bulat" })
    .min(1, { message: "Jumlah tamu minimal 1 orang" })
    .max(50, { message: "Jumlah tamu maksimal 50 orang" })
    .default(1),
});

export type KunjunganFormValues = z.infer<typeof kunjunganSchema>;

export const pegawaiSchema = z.object({
  id: z.string().optional(),
  nama: z
    .string()
    .trim()
    .min(2, { message: "Nama pegawai minimal 2 karakter" })
    .max(100, { message: "Nama pegawai terlalu panjang" }),
  nip: z.string().trim().optional().nullable(),
  jabatan: z.string().trim().optional().nullable(),
  divisi: z
    .string()
    .trim()
    .min(2, { message: "Divisi pegawai minimal 2 karakter" })
    .max(100, { message: "Nama divisi terlalu panjang" }),
  is_active: z.boolean().optional().default(true),
});

export type PegawaiFormValues = z.infer<typeof pegawaiSchema>;

export const adminAuthSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Format email tidak valid (contoh: admin@kantor.go.id)" }),
  password: z
    .string()
    .min(6, { message: "Kata sandi minimal 6 karakter" }),
});

export type AdminAuthValues = z.infer<typeof adminAuthSchema>;
