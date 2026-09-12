'use server';

import { createClient } from '@/lib/supabase/server';
import { generateBookingCode } from '@/lib/utils';
import { kunjunganSchema, type KunjunganFormValues } from '@/lib/validations/kunjungan';
import type { Kunjungan, Pegawai, StatusKunjungan } from '@/types/database';

export async function submitKunjunganAction(rawData: KunjunganFormValues) {
  try {
    const validated = kunjunganSchema.parse(rawData);
    const supabase = await createClient();

    let isUnique = false;
    let bookingCode = '';
    let attempts = 0;

    // Ensure unique booking code
    while (!isUnique && attempts < 5) {
      attempts++;
      bookingCode = generateBookingCode();
      const { data } = await supabase
        .from('kunjungan')
        .select('id')
        .eq('booking_code', bookingCode)
        .maybeSingle();

      if (!data) {
        isUnique = true;
      }
    }

    const { data: insertedData, error } = await supabase
      .from('kunjungan')
      .insert({
        booking_code: bookingCode,
        nama_pengunjung: validated.nama_pengunjung.trim(),
        no_kontak: validated.no_kontak.trim(),
        instansi: validated.instansi.trim(),
        pegawai_tujuan: validated.pegawai_tujuan.trim(),
        divisi_tujuan: validated.divisi_tujuan ? validated.divisi_tujuan.trim() : null,
        keperluan: validated.keperluan.trim(),
        tanggal_kunjungan: validated.tanggal_kunjungan,
        jam_rencana: validated.jam_rencana || null,
        jumlah_tamu: validated.jumlah_tamu || 1,
        status: 'menunggu',
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting kunjungan:', error);
      return { success: false, error: 'Gagal menyimpan data kunjungan: ' + error.message };
    }

    return {
      success: true,
      bookingCode: insertedData.booking_code,
      data: insertedData as Kunjungan,
    };
  } catch (err: unknown) {
    console.error('Validation / Execution error in submitKunjungan:', err);
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
    return { success: false, error: msg };
  }
}

export async function getPegawaiListAction() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('pegawai')
      .select('*')
      .eq('is_active', true)
      .order('nama', { ascending: true });

    if (error) {
      console.error('Error fetching pegawai:', error);
      return { success: false, data: [] as Pegawai[] };
    }

    return { success: true, data: (data || []) as Pegawai[] };
  } catch (err) {
    console.error('getPegawaiList error:', err);
    return { success: false, data: [] as Pegawai[] };
  }
}

export async function getKunjunganByCodeAction(bookingCode: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('kunjungan')
      .select('*')
      .eq('booking_code', bookingCode.trim().toUpperCase())
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: 'Tiket kunjungan tidak ditemukan' };
    }

    return { success: true, data: data as Kunjungan };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengambil data';
    return { success: false, error: msg };
  }
}

export async function verifyAndCheckInAction(bookingCode: string, catatanAdmin?: string) {
  try {
    const supabase = await createClient();
    const cleanCode = bookingCode.trim().toUpperCase();

    // 1. Fetch record first
    const { data: current, error: fetchErr } = await supabase
      .from('kunjungan')
      .select('*')
      .eq('booking_code', cleanCode)
      .maybeSingle();

    if (fetchErr || !current) {
      return {
        success: false,
        type: 'NOT_FOUND',
        message: 'Kode QR tidak ditemukan di basis data atau tidak valid.',
      };
    }

    const item = current as Kunjungan;

    // 2. Check current status
    if (item.status === 'hadir') {
      return {
        success: false,
        type: 'ALREADY_CHECKED_IN',
        message: `Pengunjung ini sudah melakukan check-in pada pukul ${new Date(item.checkin_at || '').toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB.`,
        data: item,
      };
    }

    if (item.status === 'selesai') {
      return {
        success: false,
        type: 'ALREADY_FINISHED',
        message: 'Kunjungan ini telah selesai (check-out).',
        data: item,
      };
    }

    if (item.status === 'batal') {
      return {
        success: false,
        type: 'CANCELLED',
        message: 'Tiket kunjungan ini telah dibatalkan.',
        data: item,
      };
    }

    // 3. Process Check-in
    const nowIso = new Date().toISOString();
    const { data: updated, error: updateErr } = await supabase
      .from('kunjungan')
      .update({
        status: 'hadir',
        checkin_at: nowIso,
        catatan_admin: catatanAdmin || item.catatan_admin,
        updated_at: nowIso,
      })
      .eq('booking_code', cleanCode)
      .select()
      .single();

    if (updateErr) {
      return {
        success: false,
        type: 'ERROR',
        message: 'Gagal memperbarui status kehadiran: ' + updateErr.message,
      };
    }

    return {
      success: true,
      type: 'SUCCESS',
      message: 'Check-in berhasil diverifikasi!',
      data: updated as Kunjungan,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Kesalahan sistem saat verifikasi';
    return { success: false, type: 'ERROR', message: msg };
  }
}

export async function updateKunjunganStatusAction(
  bookingCode: string,
  newStatus: StatusKunjungan,
  catatanAdmin?: string
) {
  try {
    const supabase = await createClient();
    const nowIso = new Date().toISOString();
    const cleanCode = bookingCode.trim().toUpperCase();

    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      updated_at: nowIso,
    };

    if (newStatus === 'hadir') {
      updatePayload.checkin_at = nowIso;
    } else if (newStatus === 'selesai') {
      updatePayload.checkout_at = nowIso;
    }

    if (catatanAdmin !== undefined) {
      updatePayload.catatan_admin = catatanAdmin;
    }

    const { data, error } = await supabase
      .from('kunjungan')
      .update(updatePayload)
      .eq('booking_code', cleanCode)
      .select()
      .single();

    if (error) {
      return { success: false, error: 'Gagal mengupdate status: ' + error.message };
    }

    return { success: true, data: data as Kunjungan };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memproses aksi';
    return { success: false, error: msg };
  }
}

export async function deleteKunjunganAction(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('kunjungan').delete().eq('id', id);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menghapus data';
    return { success: false, error: msg };
  }
}

export async function getAllKunjunganAction(params?: {
  tanggal?: string;
  status?: string;
  search?: string;
}) {
  try {
    const supabase = await createClient();
    let query = supabase.from('kunjungan').select('*').order('created_at', { ascending: false });

    if (params?.tanggal && params.tanggal !== 'all') {
      query = query.eq('tanggal_kunjungan', params.tanggal);
    }

    if (params?.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }

    if (params?.search && params.search.trim().length > 0) {
      const term = `%${params.search.trim()}%`;
      query = query.or(
        `nama_pengunjung.ilike.${term},instansi.ilike.${term},pegawai_tujuan.ilike.${term},booking_code.ilike.${term}`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching kunjungan list:', error);
      return { success: false, data: [] as Kunjungan[], error: error.message };
    }

    return { success: true, data: (data || []) as Kunjungan[] };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengambil data';
    return { success: false, data: [] as Kunjungan[], error: msg };
  }
}

export async function getDashboardStatsAction() {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().slice(0, 10);

    const { data: allToday, error } = await supabase
      .from('kunjungan')
      .select('status')
      .eq('tanggal_kunjungan', today);

    if (error) {
      return {
        totalHariIni: 0,
        menunggu: 0,
        hadir: 0,
        selesai: 0,
      };
    }

    const items = allToday || [];
    return {
      totalHariIni: items.length,
      menunggu: items.filter((x) => x.status === 'menunggu').length,
      hadir: items.filter((x) => x.status === 'hadir').length,
      selesai: items.filter((x) => x.status === 'selesai').length,
    };
  } catch (err) {
    console.error('Stats error:', err);
    return {
      totalHariIni: 0,
      menunggu: 0,
      hadir: 0,
      selesai: 0,
    };
  }
}
