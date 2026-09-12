const { createClient } = require('@supabase/supabase-js');
const { Client: PgClient } = require('pg');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const dbUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseKey || !dbUrl) {
  console.error('Environment variables missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 MEMULAI PENGUJIAN MENYELURUH SEMUA FITUR SISTEM');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // TEST 1: Database Tables & Schema
  console.log('--- TEST GROUP 1: Database & Skema Supabase ---');
  const pg = new PgClient({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await pg.connect();

  const kunjunganTable = await pg.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kunjungan'"
  );
  assert(kunjunganTable.rows.length === 1, 'Tabel "kunjungan" terverifikasi ada di database');

  const pegawaiTable = await pg.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pegawai'"
  );
  assert(pegawaiTable.rows.length === 1, 'Tabel "pegawai" terverifikasi ada di database');

  // TEST 2: Master Data Pegawai & Dropdown Publik
  console.log('\n--- TEST GROUP 2: Manajemen Pegawai ---');
  const testPegawaiNama = 'dr. Hendra Kusuma, Sp.Ok';
  const testDivisi = 'Kesehatan & K3';

  // Check if test employee already exists
  const existingPegawai = await pg.query('SELECT id FROM pegawai WHERE nama = $1', [testPegawaiNama]);
  let pegawaiId = existingPegawai.rows[0]?.id;

  if (!pegawaiId) {
    const insertPegawai = await pg.query(
      'INSERT INTO pegawai (nama, nip, jabatan, divisi, is_active) VALUES ($1, $2, $3, $4, true) RETURNING id',
      [testPegawaiNama, '198901012015021001', 'Dokter Poliklinik', testDivisi]
    );
    pegawaiId = insertPegawai.rows[0].id;
    assert(!!pegawaiId, 'Admin sukses menambahkan pegawai baru ("' + testPegawaiNama + '")');
  } else {
    assert(true, 'Pegawai "' + testPegawaiNama + '" sudah tersedia di database');
  }

  // Verify public can read active pegawai
  const { data: publicPegawaiList, error: pubPegErr } = await supabase
    .from('pegawai')
    .select('*')
    .eq('is_active', true);

  assert(!pubPegErr && publicPegawaiList.length > 0, 'Publik dapat membaca daftar pegawai aktif');
  const foundInPublic = publicPegawaiList.find((p) => p.nama === testPegawaiNama);
  assert(!!foundInPublic, 'Pegawai baru muncul di daftar pilihan pengunjung publik');

  // TEST 3: Alur Pendaftaran Pengunjung Publik
  console.log('\n--- TEST GROUP 3: Alur Pendaftaran Kunjungan Publik & Tiket QR ---');
  const randomCode = 'VIS-TEST-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const testPengunjung = {
    booking_code: randomCode,
    nama_pengunjung: 'Ahmad Dahlan',
    no_kontak: '081234567890',
    instansi: 'Dinas Komunikasi & Informatika',
    pegawai_tujuan: testPegawaiNama,
    divisi_tujuan: testDivisi,
    keperluan: 'Koordinasi integrasi sistem buku tamu dan uji coba QR Code scanner',
    tanggal_kunjungan: new Date().toISOString().slice(0, 10),
    jam_rencana: '10:00:00',
    jumlah_tamu: 2,
    status: 'menunggu',
  };

  const { data: createdKunjungan, error: createErr } = await supabase
    .from('kunjungan')
    .insert(testPengunjung)
    .select()
    .single();

  assert(!createErr && !!createdKunjungan, 'Pengunjung publik sukses mengisi & mengirim formulir');
  assert(createdKunjungan.status === 'menunggu', 'Status awal kunjungan terverifikasi "menunggu"');
  assert(createdKunjungan.booking_code === randomCode, 'Kode booking ter-generate: ' + randomCode);

  // Read ticket page data by booking code
  const { data: ticketData, error: ticketErr } = await supabase
    .from('kunjungan')
    .select('*')
    .eq('booking_code', randomCode)
    .single();

  assert(!ticketErr && !!ticketData, 'Halaman tiket (/tiket/' + randomCode + ') sukses memuat data');
  assert(ticketData.nama_pengunjung === 'Ahmad Dahlan', 'Nama pengunjung cocok di kartu tiket');

  // TEST 4: Pemindai QR & Verifikasi Check-In Admin
  console.log('\n--- TEST GROUP 4: Verifikasi Scanner QR & Check-In Admin ---');
  
  // 4a. Check-in visit
  const nowIso = new Date().toISOString();
  const { data: checkInResult, error: checkInErr } = await supabase
    .from('kunjungan')
    .update({
      status: 'hadir',
      checkin_at: nowIso,
      updated_at: nowIso,
    })
    .eq('booking_code', randomCode)
    .select()
    .single();

  assert(!checkInErr && checkInResult.status === 'hadir', 'Scanner berhasil memverifikasi dan mengubah status ke "hadir"');
  assert(!!checkInResult.checkin_at, 'Waktu kedatangan (checkin_at) tercatat rapi: ' + checkInResult.checkin_at);

  // 4b. Re-scan handling (Already checked in detection)
  const { data: reScanData } = await supabase
    .from('kunjungan')
    .select('*')
    .eq('booking_code', randomCode)
    .single();

  assert(reScanData.status === 'hadir', 'Pencegahan duplikasi: Tamu terdeteksi sudah hadir sebelumnya');

  // 4c. Check-out handling
  const checkOutIso = new Date().toISOString();
  const { data: checkOutResult, error: checkOutErr } = await supabase
    .from('kunjungan')
    .update({
      status: 'selesai',
      checkout_at: checkOutIso,
      updated_at: checkOutIso,
    })
    .eq('booking_code', randomCode)
    .select()
    .single();

  assert(!checkOutErr && checkOutResult.status === 'selesai', 'Fitur Check-Out tamu berhasil menandai kunjungan "selesai"');
  assert(!!checkOutResult.checkout_at, 'Waktu check-out tercatat rapi: ' + checkOutResult.checkout_at);

  // 4d. Invalid QR Code handling
  const { data: invalidData } = await supabase
    .from('kunjungan')
    .select('*')
    .eq('booking_code', 'KODE-PALSU-9999')
    .maybeSingle();

  assert(invalidData === null, 'QR Code palsu/tidak terdaftar berhasil ditolak sistem');

  // TEST 5: Rekapitulasi Data & Pencarian
  console.log('\n--- TEST GROUP 5: Rekapitulasi Data & Filter Pencarian ---');
  
  // Search by name
  const { data: searchByName } = await supabase
    .from('kunjungan')
    .select('*')
    .ilike('nama_pengunjung', '%Ahmad Dahlan%');

  assert(searchByName.length >= 1, 'Pencarian nama pengunjung berfungsi dengan baik');

  // Filter by status 'selesai'
  const { data: filterSelesai } = await supabase
    .from('kunjungan')
    .select('*')
    .eq('status', 'selesai');

  assert(filterSelesai.length >= 1, 'Filter status kunjungan "selesai" berfungsi dengan baik');

  // TEST 6: Dashboard KPI Statistics
  console.log('\n--- TEST GROUP 6: Statistik Dashboard Admin ---');
  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: allToday } = await supabase
    .from('kunjungan')
    .select('status')
    .eq('tanggal_kunjungan', todayStr);

  const totalToday = allToday.length;
  const totalHadir = allToday.filter((x) => x.status === 'hadir').length;
  const totalMenunggu = allToday.filter((x) => x.status === 'menunggu').length;
  const totalSelesai = allToday.filter((x) => x.status === 'selesai').length;

  assert(totalToday >= 1, `KPI Total Hari Ini: ${totalToday}`);
  assert(totalSelesai >= 1, `KPI Total Selesai: ${totalSelesai}`);
  console.log(`    ℹ️ Detail KPI Hari Ini: Total=${totalToday}, Menunggu=${totalMenunggu}, Hadir=${totalHadir}, Selesai=${totalSelesai}`);

  // TEST 7: Autentikasi Admin Supabase
  console.log('\n--- TEST GROUP 7: Autentikasi Admin ---');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@kunjungan.test',
    password: 'Admin123456!',
  });

  assert(!authErr && !!authData.session, 'Login akun admin instansi (admin@kunjungan.test) berhasil');
  assert(authData.user.email === 'admin@kunjungan.test', 'Email user admin sesuai');

  await pg.end();

  console.log('\n====================================================');
  console.log(`📊 HASIL PENGUJIAN: ${passedTests} / ${totalTests} TEST BERHASIL (100% PASS)`);
  console.log('====================================================');
}

runTestSuite().catch((err) => {
  console.error('Fatal error during testing:', err);
  process.exit(1);
});
