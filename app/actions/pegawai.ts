'use server';

import { createClient } from '@/lib/supabase/server';
import type { Pegawai } from '@/types/database';

export async function getAllPegawaiAdminAction() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('pegawai')
      .select('*')
      .order('nama', { ascending: true });

    if (error) {
      return { success: false, data: [] as Pegawai[], error: error.message };
    }
    return { success: true, data: (data || []) as Pegawai[] };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengambil data pegawai';
    return { success: false, data: [] as Pegawai[], error: msg };
  }
}

export async function savePegawaiAction(pegawai: {
  id?: string;
  nama: string;
  nip?: string | null;
  jabatan?: string | null;
  divisi: string;
  is_active?: boolean;
}) {
  try {
    const supabase = await createClient();

    if (pegawai.id) {
      const { data, error } = await supabase
        .from('pegawai')
        .update({
          nama: pegawai.nama.trim(),
          nip: pegawai.nip?.trim() || null,
          jabatan: pegawai.jabatan?.trim() || null,
          divisi: pegawai.divisi.trim(),
          is_active: pegawai.is_active ?? true,
        })
        .eq('id', pegawai.id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data: data as Pegawai };
    } else {
      const { data, error } = await supabase
        .from('pegawai')
        .insert({
          nama: pegawai.nama.trim(),
          nip: pegawai.nip?.trim() || null,
          jabatan: pegawai.jabatan?.trim() || null,
          divisi: pegawai.divisi.trim(),
          is_active: true,
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data: data as Pegawai };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan pegawai';
    return { success: false, error: msg };
  }
}

export async function togglePegawaiStatusAction(id: string, currentStatus: boolean) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('pegawai')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengubah status';
    return { success: false, error: msg };
  }
}

export async function deletePegawaiAction(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('pegawai').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menghapus pegawai';
    return { success: false, error: msg };
  }
}
