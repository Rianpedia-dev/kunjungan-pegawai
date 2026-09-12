'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signInAdminAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email dan password wajib diisi' };
  }

  const supabase = await createClient();

  // Try sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // If user not found and it's the first time setup, provide option or clear message
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user };
}

export async function signUpInitialAdminAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password || password.length < 6) {
    return { success: false, error: 'Email valid & password minimal 6 karakter' };
  }

  // Use direct DB connection to create confirmed user without hitting SMTP rate limit
  if (process.env.DATABASE_URL) {
    const { Client } = await import('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await client.connect();
      await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

      // Check existing
      const check = await client.query('SELECT id FROM auth.users WHERE email = $1', [email]);
      if (check.rows.length > 0) {
        // Update password & confirm
        await client.query(
          `UPDATE auth.users SET 
            encrypted_password = crypt($1, gen_salt('bf')),
            email_confirmed_at = NOW(),
            updated_at = NOW()
          WHERE email = $2`,
          [password, email]
        );
      } else {
        const ins = await client.query(
          `INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
          ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            $1,
            crypt($2, gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"role":"admin"}',
            NOW(),
            NOW()
          ) RETURNING id, email;`,
          [email, password]
        );

        const newId = ins.rows[0].id;
        await client.query(
          `INSERT INTO auth.identities (
            id,
            provider_id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
          ) VALUES (
            gen_random_uuid(),
            $1,
            $2::uuid,
            json_build_object('sub', $2::text, 'email', $3::text),
            'email',
            NOW(),
            NOW(),
            NOW()
          ) ON CONFLICT DO NOTHING;`,
          [email, newId, email]
        );
      }
      return { success: true };
    } catch (err: unknown) {
      console.error('Direct admin creation error:', err);
      const msg = err instanceof Error ? err.message : 'Gagal membuat user';
      return { success: false, error: msg };
    } finally {
      await client.end();
    }
  }

  // Fallback to standard Supabase auth
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
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
