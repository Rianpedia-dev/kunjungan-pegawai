'use server';

import { Client } from 'pg';
import { getAdminUser } from '@/app/actions/auth';
import { cleanErrorMessage } from '@/lib/utils';
import type { AdminUser } from '@/types/database';

function getPgClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured');
  }
  return new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
}

export async function getAllAdminUsersAction() {
  const client = getPgClient();
  try {
    await client.connect();
    const query = `
      SELECT 
        id, 
        email, 
        created_at, 
        last_sign_in_at, 
        raw_user_meta_data 
      FROM auth.users 
      ORDER BY created_at ASC
    `;
    const res = await client.query(query);

    const users: AdminUser[] = res.rows.map((r) => {
      const meta = (r.raw_user_meta_data || {}) as Record<string, string>;
      return {
        id: r.id,
        email: r.email,
        nama: meta.nama || (r.email === 'admin@kunjungan.test' ? 'Admin Utama' : r.email === 'admin2@kunjungan.test' ? 'Admin Operasional' : 'Administrator'),
        role: meta.role || 'Admin',
        created_at: r.created_at,
        last_sign_in_at: r.last_sign_in_at,
      };
    });

    return { success: true, data: users };
  } catch (err) {
    console.error('getAllAdminUsersAction error:', err);
    return { success: false, data: [] as AdminUser[], error: cleanErrorMessage(err) };
  } finally {
    await client.end();
  }
}

export async function saveAdminUserAction(params: {
  id?: string;
  email: string;
  password?: string;
  nama?: string;
  role?: string;
}) {
  const client = getPgClient();
  try {
    const cleanEmail = params.email.trim().toLowerCase();
    const nama = params.nama?.trim() || 'Administrator';
    const role = params.role?.trim() || 'Admin';

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Email admin tidak valid' };
    }

    await client.connect();
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

    if (params.id) {
      // UPDATE EXISTING ADMIN
      const existing = await client.query('SELECT id, email FROM auth.users WHERE id = $1', [params.id]);
      if (existing.rows.length === 0) {
        return { success: false, error: 'Akun admin tidak ditemukan' };
      }

      if (params.password && params.password.trim().length > 0) {
        if (params.password.trim().length < 6) {
          return { success: false, error: 'Kata sandi baru minimal 6 karakter' };
        }
        await client.query(
          `UPDATE auth.users SET 
            email = $1,
            encrypted_password = crypt($2, gen_salt('bf')),
            raw_user_meta_data = json_build_object('nama', $3::text, 'role', $4::text),
            updated_at = NOW()
          WHERE id = $5`,
          [cleanEmail, params.password.trim(), nama, role, params.id]
        );
      } else {
        await client.query(
          `UPDATE auth.users SET 
            email = $1,
            raw_user_meta_data = json_build_object('nama', $2::text, 'role', $3::text),
            updated_at = NOW()
          WHERE id = $4`,
          [cleanEmail, nama, role, params.id]
        );
      }

      // Update identity email if exists
      await client.query(
        `UPDATE auth.identities SET 
          identity_data = json_build_object('sub', $1::text, 'email', $2::text),
          updated_at = NOW()
        WHERE user_id = $1`,
        [params.id, cleanEmail]
      );

      return { success: true, message: 'Data akun admin berhasil diperbarui' };
    } else {
      // CREATE NEW ADMIN
      if (!params.password || params.password.trim().length < 6) {
        return { success: false, error: 'Kata sandi minimal 6 karakter' };
      }

      const dupCheck = await client.query('SELECT id FROM auth.users WHERE email = $1', [cleanEmail]);
      if (dupCheck.rows.length > 0) {
        return { success: false, error: 'Email tersebut sudah terdaftar sebagai admin' };
      }

      const insertRes = await client.query(
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
          json_build_object('nama', $3::text, 'role', $4::text),
          NOW(),
          NOW()
        ) RETURNING id, email;`,
        [cleanEmail, params.password.trim(), nama, role]
      );

      const newUserId = insertRes.rows[0].id;
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
        [cleanEmail, newUserId, cleanEmail]
      );

      return { success: true, message: 'Akun admin baru berhasil dibuat' };
    }
  } catch (err) {
    console.error('saveAdminUserAction error:', err);
    return { success: false, error: cleanErrorMessage(err) };
  } finally {
    await client.end();
  }
}

export async function deleteAdminUserAction(id: string) {
  const client = getPgClient();
  try {
    // 1. Check current logged in admin
    const currentUser = await getAdminUser();
    if (currentUser && currentUser.id === id) {
      return {
        success: false,
        error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.',
      };
    }

    await client.connect();

    // 2. Ensure at least 1 admin remains
    const countRes = await client.query('SELECT COUNT(*) FROM auth.users');
    const totalCount = parseInt(countRes.rows[0].count, 10);
    if (totalCount <= 1) {
      return {
        success: false,
        error: 'Tidak dapat menghapus akun admin terakhir. Minimal harus ada 1 akun admin.',
      };
    }

    // 3. Delete identities first then user
    await client.query('DELETE FROM auth.identities WHERE user_id = $1', [id]);
    await client.query('DELETE FROM auth.users WHERE id = $1', [id]);

    return { success: true, message: 'Akun admin berhasil dihapus' };
  } catch (err) {
    console.error('deleteAdminUserAction error:', err);
    return { success: false, error: cleanErrorMessage(err) };
  } finally {
    await client.end();
  }
}

export async function getDemoAccountsSettingAction() {
  const client = getPgClient();
  try {
    await client.connect();
    const res = await client.query(
      `SELECT value FROM pengaturan_sistem WHERE key = 'tampilkan_akun_demo' LIMIT 1`
    );
    if (res.rows.length === 0) {
      return { success: true, enabled: true };
    }
    return { success: true, enabled: res.rows[0].value === 'true' };
  } catch (err) {
    console.error('getDemoAccountsSettingAction error:', err);
    return { success: true, enabled: true }; // default fallback
  } finally {
    await client.end();
  }
}

export async function toggleDemoAccountsSettingAction(enabled: boolean) {
  const client = getPgClient();
  try {
    await client.connect();
    await client.query(
      `INSERT INTO pengaturan_sistem (key, value, updated_at) 
       VALUES ('tampilkan_akun_demo', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [enabled ? 'true' : 'false']
    );
    return { success: true, enabled };
  } catch (err) {
    console.error('toggleDemoAccountsSettingAction error:', err);
    return { success: false, error: cleanErrorMessage(err) };
  } finally {
    await client.end();
  }
}
