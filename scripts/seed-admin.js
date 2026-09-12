const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;
const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function seedAdminUser(email, password) {
  // Check if admin user already exists
  const existing = await client.query('SELECT id, email FROM auth.users WHERE email = $1', [email]);

  if (existing.rows.length > 0) {
    console.log('Admin already exists:', existing.rows[0]);
    // Update password just in case
    await client.query(
      `UPDATE auth.users SET 
        encrypted_password = crypt($1, gen_salt('bf')),
        email_confirmed_at = NOW(),
        updated_at = NOW()
      WHERE email = $2`,
      [password, email]
    );
    console.log(`Password updated and email confirmed for ${email}.`);
  } else {
    // Insert new confirmed user into auth.users
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
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
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
        NOW(),
        '',
        '',
        '',
        ''
      ) RETURNING id, email;`,
      [email, password]
    );

    const newUserId = insertRes.rows[0].id;
    console.log(`Created user in auth.users for ${email}:`, newUserId);

    // Also insert into auth.identities so Supabase GoTrue Auth finds the provider identity
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
      [email, newUserId, email]
    );

    console.log(`Created identity in auth.identities for ${email}.`);
  }
}

async function main() {
  await client.connect();
  console.log('Connected to DB.');

  // Create extension if not exists
  await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

  const accounts = [
    { email: 'admin@kunjungan.test', password: 'Admin123456!' },
    { email: 'admin2@kunjungan.test', password: 'Admin123456!' },
  ];

  for (const acc of accounts) {
    await seedAdminUser(acc.email, acc.password);
  }

  await client.end();
  console.log('\nAdmin users setup complete! Available accounts:');
  accounts.forEach((acc, i) => {
    console.log(`- Akun Admin ${i + 1}: ${acc.email} / ${acc.password}`);
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
