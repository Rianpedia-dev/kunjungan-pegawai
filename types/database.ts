export type StatusKunjungan = 'menunggu' | 'hadir' | 'selesai' | 'batal';

export interface Kunjungan {
  id: string;
  booking_code: string;
  nama_pengunjung: string;
  no_kontak: string;
  instansi: string;
  pegawai_tujuan: string;
  divisi_tujuan?: string | null;
  keperluan: string;
  tanggal_kunjungan: string;
  jam_rencana?: string | null;
  jumlah_tamu: number;
  status: StatusKunjungan;
  checkin_at?: string | null;
  checkout_at?: string | null;
  catatan_admin?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pegawai {
  id: string;
  nama: string;
  nip?: string | null;
  jabatan?: string | null;
  divisi: string;
  is_active: boolean;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  nama?: string | null;
  role?: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
}

export interface PengaturanSistem {
  key: string;
  value: string;
  description?: string | null;
  updated_at: string;
}
