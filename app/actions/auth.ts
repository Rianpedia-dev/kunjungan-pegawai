'use server';

import { createClient } from '@/lib/supabase/server';
import { cleanErrorMessage } from '@/lib/utils';
import { redirect } from 'next/navigation';

export async function signInAdminAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email dan kata sandi wajib diisi' };
  }

  const supabase = await createClient();

  // Try sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    let msg = error.message;
    if (msg.toLowerCase().includes('invalid login credentials')) {
      msg = 'Email atau kata sandi tidak cocok. Silakan periksa kembali.';
    } else if (msg.toLowerCase().includes('email not confirmed')) {
      msg = 'Email belum dikonfirmasi.';
    }
    return { success: false, error: cleanErrorMessage(msg) };
  }

  return { success: true, user: data.user };
}

export async function signOutAdminAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

export async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
