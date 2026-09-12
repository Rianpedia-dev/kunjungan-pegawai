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

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL successfully.');

    // 1. Create enum if not exists
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE status_kunjungan AS ENUM ('menunggu', 'hadir', 'selesai', 'batal');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('Status enum checked/created.');

    // 2. Create kunjungan table
    await client.query(`
      CREATE TABLE IF NOT EXISTS kunjungan (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_code VARCHAR(30) UNIQUE NOT NULL,
        nama_pengunjung VARCHAR(150) NOT NULL,
        no_kontak VARCHAR(25) NOT NULL,
        instansi VARCHAR(150) NOT NULL,
        pegawai_tujuan VARCHAR(150) NOT NULL,
        divisi_tujuan VARCHAR(100),
        keperluan TEXT NOT NULL,
        tanggal_kunjungan DATE NOT NULL DEFAULT CURRENT_DATE,
        jam_rencana TIME WITHOUT TIME ZONE,
        jumlah_tamu INT DEFAULT 1,
        status status_kunjungan DEFAULT 'menunggu',
        checkin_at TIMESTAMPTZ,
        checkout_at TIMESTAMPTZ,
        catatan_admin TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Table kunjungan checked/created.');

    // 3. Create pegawai table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pegawai (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nama VARCHAR(150) NOT NULL,
        nip VARCHAR(50),
        jabatan VARCHAR(100),
        divisi VARCHAR(100) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Table pegawai checked/created.');

    // 4. Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_kunjungan_booking_code ON kunjungan (booking_code);
      CREATE INDEX IF NOT EXISTS idx_kunjungan_tanggal ON kunjungan (tanggal_kunjungan);
      CREATE INDEX IF NOT EXISTS idx_kunjungan_status ON kunjungan (status);
    `);
    console.log('Indexes checked/created.');

    // 5. Seed sample pegawai if empty
    const checkPegawai = await client.query('SELECT COUNT(*) FROM pegawai');
    if (parseInt(checkPegawai.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO pegawai (nama, nip, jabatan, divisi) VALUES
        ('Budi Santoso, S.Kom', '198503152010011002', 'Kepala Divisi IT & Sistem Informasi', 'Teknologi Informasi'),
        ('Siti Rahmawati, S.E.', '199004222014022001', 'Staff SDM & Kepegawaian', 'Sumber Daya Manusia'),
        ('Ahmad Fauzi, M.M.', '198211082008011003', 'Manajer Keuangan & Anggaran', 'Keuangan'),
        ('Dewi Lestari, S.T.', '199207192018012004', 'Staff Pelayanan Publik & Kerjasama', 'Humas & Protokol'),
        ('Rian Hidayat, S.Sos', '198805122011011005', 'Koordinator Sarana & Prasarana', 'Umum & Logistik');
      `);
      console.log('Sample pegawai seeded.');
    } else {
      console.log('Pegawai data already exists, skipping seed.');
    }

    // 6. Enable RLS and setup policies
    await client.query(`
      ALTER TABLE kunjungan ENABLE ROW LEVEL SECURITY;
      ALTER TABLE pegawai ENABLE ROW LEVEL SECURITY;

      -- Allow anon select and insert on kunjungan
      DROP POLICY IF EXISTS "Anon can insert kunjungan" ON kunjungan;
      CREATE POLICY "Anon can insert kunjungan" ON kunjungan FOR INSERT TO anon, authenticated WITH CHECK (true);

      DROP POLICY IF EXISTS "Anon can select kunjungan" ON kunjungan;
      CREATE POLICY "Anon can select kunjungan" ON kunjungan FOR SELECT TO anon, authenticated USING (true);

      DROP POLICY IF EXISTS "Allow updates on kunjungan" ON kunjungan;
      CREATE POLICY "Allow updates on kunjungan" ON kunjungan FOR UPDATE TO anon, authenticated USING (true);

      DROP POLICY IF EXISTS "Allow delete on kunjungan" ON kunjungan;
      CREATE POLICY "Allow delete on kunjungan" ON kunjungan FOR DELETE TO anon, authenticated USING (true);

      -- Allow anon select on active pegawai
      DROP POLICY IF EXISTS "Allow select pegawai" ON pegawai;
      CREATE POLICY "Allow select pegawai" ON pegawai FOR SELECT TO anon, authenticated USING (true);

      DROP POLICY IF EXISTS "Allow all on pegawai" ON pegawai;
      CREATE POLICY "Allow all on pegawai" ON pegawai FOR ALL TO anon, authenticated USING (true);
    `);
    console.log('RLS policies applied.');

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
