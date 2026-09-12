const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runSettingsMigration() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS pengaturan_sistem (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Insert default for tampilkan_akun_demo if not exists
      INSERT INTO pengaturan_sistem (key, value, description)
      VALUES ('tampilkan_akun_demo', 'true', 'Tampilkan tombol akun demo di halaman login')
      ON CONFLICT (key) DO NOTHING;

      -- Enable RLS
      ALTER TABLE pengaturan_sistem ENABLE ROW LEVEL SECURITY;

      -- Allow read to anon & authenticated
      DROP POLICY IF EXISTS "Allow select pengaturan_sistem" ON pengaturan_sistem;
      CREATE POLICY "Allow select pengaturan_sistem" ON pengaturan_sistem
        FOR SELECT TO anon, authenticated USING (true);

      -- Allow update/insert to authenticated
      DROP POLICY IF EXISTS "Allow update pengaturan_sistem" ON pengaturan_sistem;
      CREATE POLICY "Allow update pengaturan_sistem" ON pengaturan_sistem
        FOR ALL TO anon, authenticated USING (true);
    `);

    console.log('Table pengaturan_sistem created & configured successfully!');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSettingsMigration();
