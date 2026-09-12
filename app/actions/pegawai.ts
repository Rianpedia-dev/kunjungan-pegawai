'use server';

import { createClient } from '@/lib/supabase/server';
import { cleanErrorMessage, extractZodFieldErrors } from '@/lib/utils';
import { pegawaiSchema } from '@/lib/validations/kunjungan';
import type { Pegawai } from '@/types/database';

export async function getAllPegawaiAdminAction() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('pegawai')
      .select('*')
      .order('nama', { ascending: true });

    if (error) {
      return { success: false, data: [] as Pegawai[], error: cleanErrorMessage(error.message) };
    }
    return { success: true, data: (data || []) as Pegawai[] };
  } catch (err: unknown) {
    const msg = cleanErrorMessage(err);
    return { success: false, data: [] as Pegawai[], error: msg || 'Gagal mengambil data pegawai' };
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
    const parsed = pegawaiSchema.safeParse(pegawai);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      });
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Data pegawai tidak valid',
        fieldErrors,
      };
    }

    const validated = parsed.data;
    const supabase = await createClient();

    if (validated.id) {
      const { data, error } = await supabase
        .from('pegawai')
        .update({
          nama: validated.nama,
          nip: validated.nip || null,
          jabatan: validated.jabatan || null,
          divisi: validated.divisi,
          is_active: validated.is_active ?? true,
        })
        .eq('id', validated.id)
        .select()
        .single();

      if (error) return { success: false, error: cleanErrorMessage(error.message) };
      return { success: true, data: data as Pegawai };
    } else {
      const { data, error } = await supabase
        .from('pegawai')
        .insert({
          nama: validated.nama,
          nip: validated.nip || null,
          jabatan: validated.jabatan || null,
          divisi: validated.divisi,
          is_active: true,
        })
        .select()
        .single();

      if (error) return { success: false, error: cleanErrorMessage(error.message) };
      return { success: true, data: data as Pegawai };
    }
  } catch (err: unknown) {
    const msg = cleanErrorMessage(err);
    const fieldErrors = extractZodFieldErrors(err);
    return {
      success: false,
      error: msg || 'Gagal menyimpan pegawai',
      fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
    };
  }
}

export async function togglePegawaiStatusAction(id: string, currentStatus: boolean) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('pegawai')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) return { success: false, error: cleanErrorMessage(error.message) };
    return { success: true };
  } catch (err: unknown) {
    const msg = cleanErrorMessage(err);
    return { success: false, error: msg || 'Gagal mengubah status' };
  }
}

export async function deletePegawaiAction(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('pegawai').delete().eq('id', id);
    if (error) return { success: false, error: cleanErrorMessage(error.message) };
    return { success: true };
  } catch (err: unknown) {
    const msg = cleanErrorMessage(err);
    return { success: false, error: msg || 'Gagal menghapus pegawai' };
  }
}
