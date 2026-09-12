import { z } from "zod";

export const kunjunganSchema = z.object({
  nama_pengunjung: z
    .string()
    .min(3, { message: "Nama pengunjung minimal 3 karakter" })
    .max(100, { message: "Nama terlalu panjang" }),
  no_kontak: z
    .string()
    .min(9, { message: "Nomor kontak / WhatsApp minimal 9 digit" })
    .max(20, { message: "Nomor kontak tidak valid" })
    .regex(/^[0-9+-\s]+$/, { message: "Format nomor telepon tidak valid" }),
  instansi: z
    .string()
    .min(2, { message: "Nama instansi / lembaga / pribadi wajib diisi" })
    .max(100, { message: "Nama instansi terlalu panjang" }),
  pegawai_tujuan: z
    .string()
    .min(2, { message: "Nama pegawai tujuan wajib dipilih atau diisi" }),
  divisi_tujuan: z.string().optional().nullable(),
  keperluan: z
    .string()
    .min(5, { message: "Keperluan kunjungan minimal 5 karakter" })
    .max(500, { message: "Keperluan maksimal 500 karakter" }),
  tanggal_kunjungan: z
    .string()
    .min(1, { message: "Tanggal kunjungan wajib ditentukan" }),
  jam_rencana: z.string().optional().nullable(),
  jumlah_tamu: z
    .number()
    .min(1, { message: "Jumlah tamu minimal 1 orang" })
    .max(50, { message: "Jumlah tamu maksimal 50 orang" })
    .default(1),
});

export type KunjunganFormValues = z.infer<typeof kunjunganSchema>;
