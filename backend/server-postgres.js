const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS ayarları - Tüm domain'leri ekle
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
    'https://tesis-kontrol.vercel.app',
    'https://tesis-kontrol-p2ig88ats-emrahs-projects-7d7ccaf2.vercel.app',
    'https://tesis-kontrol-aob4vd5yz-emrahs-projects-7d7ccaf2.vercel.app',
    'https://tesis-kontrol-alyk5p34i-emrahs-projects-7d7ccaf2.vercel.app',
    'https://tesis-kontrol-iz1nmkiy5-emrahs-projects-7d7ccaf2.vercel.app',
    'https://tesis-kontrol-l75x0nhat-emrahs-projects-7d7ccaf2.vercel.app',
    'https://tesis-kontrol-ige7r8252-emrahs-projects-7d7ccaf2.vercel.app',
    'https://tesis-kontrol-ad6gldqkn-emrahs-projects-7d7ccaf2.vercel.app',
    'https://tesis-kontrol-91j5k4dm8-emrahs-projects-7d7ccaf2.vercel.app',
    'https://tesis-kontrol-2jikuppge-emrahs-projects-7d7ccaf2.vercel.app',
    'https://tesis-kontrol-9lcbptk5z-emrahs-projects-7d7ccaf2.vercel.app',
    'https://tesis-kontrol-jp8bmjt9r-emrahs-projects-7d7ccaf2.vercel.app',
    'https://tesis-kontrol-8ql7wlog0-emrahs-projects-7d7ccaf2.vercel.app',
    'https://tesis-kontrol-puhvga66y-emrahs-projects-7d7ccaf2.vercel.app',
    'https://tesis-kontrol-ljhkiznrw-emrahs-projects-7d7ccaf2.vercel.app',
    'https://tesis-kontrol-j9apw032c-emrahs-projects-7d7ccaf2.vercel.app',
    'https://tesis-kontrol-31eh0kjyu-emrahs-projects-7d7ccaf2.vercel.app',
    'https://tesis-kontrol-hp8pysxiu-emrahs-projects-7d7ccaf2.vercel.app',
    'https://tesis-kontrol-a0sm9mvfa-emrahs-projects-7d7ccaf2.vercel.app',
    'https://tesis-kontrol-iazofcnat-emrahs-projects-7d7ccaf2.vercel.app',
    'https://tesis-kontrol-6g6i9640f-emrahs-projects-7d7ccaf2.vercel.app',
    'https://tesis-kontrol-43wz0q08f-emrahs-projects-7d7ccaf2.vercel.app',
    'https://backend-hn9f3hqhw-emrahs-projects-7d7ccaf2.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// PostgreSQL bağlantısı - Neon.tech için optimize edilmiş
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Neon.tech için optimize edilmiş pool ayarları
  max: 5, // Daha az bağlantı
  min: 1,  // Minimum bağlantı
  idleTimeoutMillis: 60000, // 60 saniye
  connectionTimeoutMillis: 10000, // 10 saniye
  maxUses: 1000, // Daha az kullanım
  allowExitOnIdle: true
});

// Pool event handlers
pool.on('connect', (client) => {
  console.log('Yeni database bağlantısı oluşturuldu');
});

pool.on('error', (err, client) => {
  console.error('Database pool hatası:', err);
});

pool.on('remove', (client) => {
  console.log('Database bağlantısı kaldırıldı');
});

// Test endpoint'i
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server çalışıyor!',
    database_url: process.env.DATABASE_URL ? 'Mevcut' : 'Eksik',
    timestamp: new Date().toISOString()
  });
});

// PostgreSQL bağlantı test endpoint'i
app.get('/api/postgres-test', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    res.json({
      message: 'PostgreSQL bağlantı testi başarılı!',
      current_time: result.rows[0].now,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'PostgreSQL bağlantı hatası',
      message: error.message
    });
  }
});

// Debug endpoint'i - tüm tabloları kontrol et
app.get('/api/debug', async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Tüm tabloları kontrol et
    const tables = ['users', 'facilities', 'bagtv_facilities', 'control_items', 'messages'];
    const tableCounts = {};
    
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        tableCounts[table] = parseInt(result.rows[0].count);
      } catch (error) {
        tableCounts[table] = 'Tablo yok';
      }
    }
    
    client.release();
    
    res.json({
      message: 'Tüm tablolar debug',
      tables: tableCounts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Debug hatası',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Setup database endpoint'i
app.get('/api/setup-database', async (req, res) => {
  try {
    await initializeDatabase();
    res.json({
      message: 'Veritabanı başarıyla kuruldu',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Database setup hatası',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// BagTV Controls endpoint'leri
app.get('/api/bagtv-controls', async (req, res) => {
  try {
    const { facilityId } = req.query;
    
    let query = 'SELECT * FROM bagtv_controls';
    let params = [];
    
    if (facilityId) {
      query += ' WHERE facility_id = $1';
      params.push(facilityId);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('BagTV controls GET error:', error);
    res.status(500).json({ error: 'Database hatası' });
  }
});

app.post('/api/bagtv-controls', async (req, res) => {
  try {
    const { facilityId, date, action, description, checkedBy } = req.body;
    
    const query = `
      INSERT INTO bagtv_controls (facility_id, date, action, description, checked_by, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    
    const params = [facilityId, date, action, description, checkedBy];
    
    const result = await pool.query(query, params);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('BagTV controls POST error:', error);
    res.status(500).json({ error: 'Kayıt eklenirken hata oluştu' });
  }
});

app.delete('/api/bagtv-controls/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'ID gerekli' });
    }
    
    const query = 'DELETE FROM bagtv_controls WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Kayıt bulunamadı' });
    }
    
    res.status(200).json({ message: 'Kayıt başarıyla silindi' });
  } catch (error) {
    console.error('BagTV controls DELETE error:', error);
    res.status(500).json({ error: 'Kayıt silinirken hata oluştu' });
  }
});

// Test verisi ekleme endpoint'i
app.post('/api/add-test-data', async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Test tesisleri ekle
    const facilities = [
      { name: 'Test Tesis 1', description: 'Test açıklama 1', status: 'Aktif' },
      { name: 'Test Tesis 2', description: 'Test açıklama 2', status: 'Aktif' },
      { name: 'Test Tesis 3', description: 'Test açıklama 3', status: 'Pasif' }
    ];
    
    for (const facility of facilities) {
      await client.query(
        'INSERT INTO facilities (name, description, status) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [facility.name, facility.description, facility.status]
      );
    }
    
    // Test kontrol işleri ekle
    const controlItems = [
      { title: 'Günlük Test İş 1', description: 'Günlük test açıklama', period: 'Günlük', date: '2025-07-30', facility_id: 1, work_done: 'Test iş yapıldı', user: 'Test Kullanıcı', status: 'Tamamlandı' },
      { title: 'Haftalık Test İş 1', description: 'Haftalık test açıklama', period: 'Haftalık', date: '2025-07-30', facility_id: 2, work_done: 'Test iş yapıldı', user: 'Test Kullanıcı', status: 'İşlemde' },
      { title: 'Aylık Test İş 1', description: 'Aylık test açıklama', period: 'Aylık', date: '2025-07-30', facility_id: 1, work_done: 'Test iş yapıldı', user: 'Test Kullanıcı', status: 'Beklemede' },
      { title: 'Yıllık Test İş 1', description: 'Yıllık test açıklama', period: 'Yıllık', date: '2025-07-30', facility_id: 3, work_done: 'Test iş yapıldı', user: 'Test Kullanıcı', status: 'Tamamlandı' }
    ];
    
    for (const item of controlItems) {
      await client.query(
        'INSERT INTO control_items (title, description, period, date, facility_id, work_done, user_name, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING',
        [item.title, item.description, item.period, item.date, item.facility_id, item.work_done, item.user, item.status]
      );
    }
    
    // Test mesajları ekle
    const messages = [
      { date: '2025-07-30', total_count: 100, pulled_count: 85, account: 'Yasin Yıldız', sender: 'Test Kullanıcı', description: 'Test mesaj açıklama 1' },
      { date: '2025-07-29', total_count: 150, pulled_count: 120, account: 'Abdullah Özdemir', sender: 'Test Kullanıcı', description: 'Test mesaj açıklama 2' },
      { date: '2025-07-28', total_count: 80, pulled_count: 75, account: 'Bağcılar Belediyesi', sender: 'Test Kullanıcı', description: 'Test mesaj açıklama 3' }
    ];
    
    for (const message of messages) {
      await client.query(
        'INSERT INTO messages (date, total_count, pulled_count, account, sender, description) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING',
        [message.date, message.total_count, message.pulled_count, message.account, message.sender, message.description]
      );
    }
    
    // Test BağTV tesisleri ekle
    const bagtvFacilities = [
      { name: 'BağTV Test Tesis 1', tv_count: 5, description: 'BağTV test açıklama 1', status: 'Aktif' },
      { name: 'BağTV Test Tesis 2', tv_count: 3, description: 'BağTV test açıklama 2', status: 'Aktif' },
      { name: 'BağTV Test Tesis 3', tv_count: 7, description: 'BağTV test açıklama 3', status: 'Pasif' }
    ];
    
    for (const facility of bagtvFacilities) {
      await client.query(
        'INSERT INTO bagtv_facilities (name, tv_count, description, status) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [facility.name, facility.tv_count, facility.description, facility.status]
      );
    }
    
    client.release();
    
    res.json({
      message: 'Test verileri başarıyla eklendi',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test verisi ekleme hatası:', error);
    res.status(500).json({
      error: 'Test verisi eklenemedi',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});



// Tüm tabloları oluştur ve admin kullanıcısını ekle - Basitleştirilmiş
async function initializeDatabase() {
  try {
    console.log('Database başlatılıyor...');
    const client = await pool.connect();
    
    // Basit tablo kontrolü
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Admin kullanıcısını kontrol et ve ekle
    const userResult = await client.query('SELECT COUNT(*) FROM users WHERE username = $1', ['admin']);
    if (parseInt(userResult.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO users (username, email, password, role) 
        VALUES ('admin', 'admin@admin.com', 'admin123', 'admin')
      `);
      console.log('Admin kullanıcısı eklendi');
    }
    
    client.release();
    console.log('Database başarıyla başlatıldı');
    
  } catch (error) {
    console.error('Database başlatma hatası:', error.message);
    // Hata olsa bile server çalışmaya devam etsin
  }
}

// Veritabanını başlat
initializeDatabase();

// API Endpoints
app.get('/api/facilities', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM facilities ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Facilities alınamadı' });
  }
});

app.post('/api/facilities', async (req, res) => {
  try {
    const { name, location, description, status } = req.body;
    const result = await pool.query(
      'INSERT INTO facilities (name, location, description, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, location, description, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Facility oluşturulamadı' });
  }
});

app.get('/api/bagtv-facilities', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bagtv_facilities ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'BagTV facilities alınamadı' });
  }
});

app.post('/api/bagtv-facilities', async (req, res) => {
  try {
    const { name, tv_count, description, status } = req.body;
    console.log('BagTV facility request body:', req.body);
    
    const result = await pool.query(
      'INSERT INTO bagtv_facilities (name, tv_count, description, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, tv_count, description, status]
    );
    console.log('BagTV facility created:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('BagTV facility creation error:', error);
    res.status(500).json({ error: 'BagTV facility oluşturulamadı', message: error.message });
  }
});

app.put('/api/bagtv-facilities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, tv_count, description, status } = req.body;
    console.log('BagTV facility update request body:', req.body);
    
    const result = await pool.query(
      'UPDATE bagtv_facilities SET name = $1, tv_count = $2, description = $3, status = $4 WHERE id = $5 RETURNING *',
      [name, tv_count, description, status, id]
    );
    console.log('BagTV facility updated:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('BagTV facility update error:', error);
    res.status(500).json({ error: 'BagTV facility güncellenemedi', message: error.message });
  }
});

app.delete('/api/bagtv-facilities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM bagtv_facilities WHERE id = $1', [id]);
    res.json({ message: 'BagTV facility silindi' });
  } catch (error) {
    console.error('BagTV facility deletion error:', error);
    res.status(500).json({ error: 'BagTV facility silinemedi', message: error.message });
  }
});

app.get('/api/control-items', async (req, res) => {
  try {
    const { period, user } = req.query;
    console.log('Control items request - period:', period, 'user:', user);
    
    let query = 'SELECT * FROM control_items';
    let params = [];
    let paramIndex = 1;
    
    // WHERE koşullarını oluştur
    const conditions = [];
    
    if (period) {
      conditions.push(`period = $${paramIndex}`);
      params.push(period);
      paramIndex++;
    }
    
    // Kullanıcı bazlı filtreleme - admin değilse sadece kendi işlerini göster
    if (user && user !== 'admin') {
      conditions.push(`user_name = $${paramIndex}`);
      params.push(user);
      paramIndex++;
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY date DESC';
    console.log('Control items query:', query, 'params:', params);
    
    const result = await pool.query(query, params);
    console.log('Control items result:', result.rows);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Control items error:', error);
    res.status(500).json({ error: 'Control items alınamadı', message: error.message });
  }
});

app.post('/api/control-items', async (req, res) => {
  try {
    const { title, description, period, date, facilityId, workDone, user, status, completionDate } = req.body;
    console.log('Control item request body:', req.body);
    
    // completionDate null ise undefined yap
    const finalCompletionDate = completionDate || null;
    
    const result = await pool.query(
      'INSERT INTO control_items (title, description, period, date, facility_id, work_done, user_name, status, completion_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [title, description, period, date, facilityId, workDone, user, status, finalCompletionDate]
    );
    console.log('Control item created:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Control item creation error:', error);
    res.status(500).json({ error: 'Control item oluşturulamadı', message: error.message });
  }
});

app.put('/api/control-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, period, date, facilityId, workDone, user, status, completionDate } = req.body;
    console.log('Control item update request body:', req.body);
    
    // Status değişikliğinde onay durumunu güncelle
    let approvalStatus = 'pending';
    if (status === 'Tamamlandı') {
      approvalStatus = 'pending'; // Onay bekliyor - admin onaylamalı
    } else if (status === 'Beklemede') {
      approvalStatus = 'pending'; // Onay bekliyor
    } else if (status === 'İptal') {
      approvalStatus = 'rejected'; // Reddedildi
    }

    const userName = user || 'Kullanıcı Belirtilmemiş';
    console.log('Using user name:', userName);

    // facilityId'yi facility_id'ye dönüştür
    const facility_id = facilityId || 1;
    
    // completionDate null ise undefined yap
    const finalCompletionDate = completionDate || null;

    const result = await pool.query(
      'UPDATE control_items SET title = $1, description = $2, period = $3, date = $4, facility_id = $5, work_done = $6, user_name = $7, status = $8, approval_status = $9, completion_date = $10 WHERE id = $11 RETURNING *',
      [title, description, period, date, facility_id, workDone, userName, status, approvalStatus, finalCompletionDate, id]
    );
    console.log('Control item updated:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Control item update error:', error);
    res.status(500).json({ error: 'Control item güncellenemedi', message: error.message });
  }
});

app.delete('/api/control-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting control item with id:', id);
    
    await pool.query('DELETE FROM control_items WHERE id = $1', [id]);
    console.log('Control item deleted successfully');
    res.json({ message: 'Control item silindi' });
  } catch (error) {
    console.error('Control item delete error:', error);
    res.status(500).json({ error: 'Control item silinemedi', message: error.message });
  }
});

app.get('/api/messages', async (req, res) => {
  try {
    console.log('Messages GET endpoint called');
    const result = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
    console.log('Messages query result:', result.rows);
    
    // Eğer veri yoksa, debug için tablo yapısını kontrol et
    if (result.rows.length === 0) {
      console.log('No messages found, checking table structure...');
      const tableInfo = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'messages'
      `);
      console.log('Messages table structure:', tableInfo.rows);
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Messages GET error:', error);
    res.status(500).json({ error: 'Messages alınamadı', message: error.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { date, totalCount, pulledCount, account, description, sender } = req.body;
    console.log('Message request body:', req.body);
    
    const result = await pool.query(
      'INSERT INTO messages (date, total_count, pulled_count, account, description, sender) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [date, totalCount, pulledCount, account, description, sender || 'admin']
    );
    console.log('Message created:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Message creation error:', error);
    res.status(500).json({ error: 'Message oluşturulamadı', message: error.message });
  }
});

app.put('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, totalCount, pulledCount, account, description, sender } = req.body;
    console.log('Message update request body:', req.body);
    
    const result = await pool.query(
      'UPDATE messages SET date = $1, total_count = $2, pulled_count = $3, account = $4, description = $5, sender = $6 WHERE id = $7 RETURNING *',
      [date, totalCount, pulledCount, account, description, sender || 'admin', id]
    );
    console.log('Message updated:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Message update error:', error);
    res.status(500).json({ error: 'Message güncellenemedi', message: error.message });
  }
});

app.delete('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting message with id:', id);
    
    await pool.query('DELETE FROM messages WHERE id = $1', [id]);
    console.log('Message deleted successfully');
    res.json({ message: 'Message silindi' });
  } catch (error) {
    console.error('Message delete error:', error);
    res.status(500).json({ error: 'Message silinemedi', message: error.message });
  }
});

// User endpoints
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, role, permissions, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Users alınamadı' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, email, password, role, permissions } = req.body;
    console.log('User request body:', req.body);
    
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role, permissions) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, permissions, created_at',
      [username, email, password, role, JSON.stringify(permissions || [])]
    );
    console.log('User created:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ error: 'User oluşturulamadı', message: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, role, permissions } = req.body;
    
    let query, params;
    if (password) {
      query = 'UPDATE users SET username = $1, email = $2, password = $3, role = $4, permissions = $5 WHERE id = $6 RETURNING id, username, email, role, permissions, created_at';
      params = [username, email, password, role, JSON.stringify(permissions || []), id];
    } else {
      query = 'UPDATE users SET username = $1, email = $2, role = $3, permissions = $4 WHERE id = $5 RETURNING id, username, email, role, permissions, created_at';
      params = [username, email, role, JSON.stringify(permissions || []), id];
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ error: 'User güncellenemedi', message: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User silindi' });
  } catch (error) {
    res.status(500).json({ error: 'User silinemedi' });
  }
});

// Manuel tablo oluşturma endpoint'i
app.post('/api/setup-database', async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Eski tabloları sil
    await client.query('DROP TABLE IF EXISTS control_items CASCADE');
    await client.query('DROP TABLE IF EXISTS messages CASCADE');
    
    // Users tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Facilities tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS facilities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        location VARCHAR(200),
        description TEXT,
        status VARCHAR(20) DEFAULT 'Aktif',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // BagTV Facilities tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS bagtv_facilities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        tv_count INTEGER DEFAULT 1,
        description TEXT,
        status VARCHAR(20) DEFAULT 'Aktif',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Control Items tablosu - Güncellenmiş
    await client.query(`
      CREATE TABLE IF NOT EXISTS control_items (
        id SERIAL PRIMARY KEY,
        facility_id INTEGER REFERENCES facilities(id),
        title VARCHAR(100) NOT NULL,
        description TEXT,
        period VARCHAR(20) DEFAULT 'Günlük',
        date DATE,
        work_done TEXT,
        user_name VARCHAR(100),
        status VARCHAR(20) DEFAULT 'Aktif',
        approval_status VARCHAR(20) DEFAULT 'pending',
        approved_by VARCHAR(100),
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Messages tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        total_count INTEGER NOT NULL,
        pulled_count INTEGER NOT NULL,
        account VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Default admin user oluştur
    const userResult = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userResult.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO users (username, email, password, role) 
        VALUES ('admin', 'admin@admin.com', 'admin123', 'admin')
      `);
      console.log('Default admin user created');
    }
    
    client.release();
    
    res.json({
      message: 'Veritabanı başarıyla kuruldu',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database setup error:', error);
    res.status(500).json({ 
      error: 'Database setup hatası', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint - users tablosunu kontrol et
app.get('/api/debug/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM users');
    const users = await pool.query('SELECT id, username, email, role FROM users');
    
    res.json({
      message: 'Users tablosu debug',
      total_users: result.rows[0].count,
      users: users.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Debug hatası', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint - facilities tablosunu kontrol et
app.get('/api/debug/facilities', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM facilities');
    const facilities = await pool.query('SELECT * FROM facilities');
    
    res.json({
      message: 'Facilities tablosu debug',
      total_facilities: result.rows[0].count,
      facilities: facilities.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Debug hatası', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint - tüm tabloları kontrol et
app.get('/api/debug/tables', async (req, res) => {
  try {
    const tables = ['users', 'facilities', 'bagtv_facilities', 'control_items', 'messages'];
    const results = {};
    
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        results[table] = parseInt(result.rows[0].count);
      } catch (error) {
        results[table] = `Error: ${error.message}`;
      }
    }
    
    res.json({
      message: 'Tüm tablolar debug',
      tables: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Debug hatası', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password });
    
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );
    
    console.log('Query result:', result.rows.length, 'users found');
    
    if (result.rows.length > 0) {
      res.json({ 
        success: true, 
        user: result.rows[0],
        message: 'Giriş başarılı' 
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: 'Kullanıcı adı veya şifre hatalı' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login hatası',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Taşıma işlemi endpoint'i
app.post('/api/control-items/move', async (req, res) => {
  try {
    const { sourcePeriod, targetPeriod } = req.body;
    
    if (!sourcePeriod || !targetPeriod) {
      return res.status(400).json({ 
        error: 'Kaynak ve hedef periyot belirtilmelidir',
        message: 'sourcePeriod ve targetPeriod parametreleri gerekli'
      });
    }

    console.log(`Taşıma işlemi başlatıldı: ${sourcePeriod} -> ${targetPeriod}`);

    const client = await pool.connect();

    try {
      // Kaynak periyottaki tamamlanmış işleri al
      const sourceQuery = `
        SELECT * FROM control_items 
        WHERE period = $1 
        AND (status = 'Tamamlandı' OR status = 'Tamamlandi' OR status = 'Yapılmadı')
        ORDER BY date DESC
      `;
      
      const sourceResult = await client.query(sourceQuery, [sourcePeriod]);
      const sourceItems = sourceResult.rows;

      console.log(`${sourcePeriod} periyotunda ${sourceItems.length} iş bulundu`);

      if (sourceItems.length === 0) {
        return res.json({
          message: `${sourcePeriod} periyotunda taşınacak iş bulunamadı`,
          movedCount: 0,
          sourcePeriod,
          targetPeriod
        });
      }

      let movedCount = 0;
      let errorCount = 0;
      const errors = [];

      // Her iş için taşıma işlemi
      for (const item of sourceItems) {
        try {
          // Hedef periyotta aynı iş var mı kontrol et
          const existingQuery = `
            SELECT id FROM control_items 
            WHERE period = $1 
            AND title = $2 
            AND facility_id = $3
          `;
          
          const existingResult = await client.query(existingQuery, [
            targetPeriod, 
            item.title, 
            item.facility_id
          ]);

          if (existingResult.rows.length > 0) {
            console.log(`İş zaten ${targetPeriod} periyotunda mevcut: ${item.title}`);
            continue;
          }

          // Yeni iş oluştur
          const insertQuery = `
            INSERT INTO control_items (
              title, description, period, date, facility_id, 
              work_done, user, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
          `;

          const insertResult = await client.query(insertQuery, [
            item.title,
            item.description,
            targetPeriod,
            item.date,
            item.facility_id,
            item.work_done,
            item.user,
            'Beklemede' // Yeni periyotta beklemeye al
          ]);

          console.log(`İş başarıyla taşındı: ${item.title} -> ${targetPeriod}`);
          movedCount++;

        } catch (error) {
          console.error(`İş taşıma hatası: ${item.title}`, error);
          errors.push({
            item: item.title,
            error: error.message
          });
          errorCount++;
        }
      }

      // Kaynak periyottaki işleri sil
      if (movedCount > 0) {
        const deleteQuery = `
          DELETE FROM control_items 
          WHERE period = $1 
          AND (status = 'Tamamlandı' OR status = 'Tamamlandi' OR status = 'Yapılmadı')
        `;
        
        const deleteResult = await client.query(deleteQuery, [sourcePeriod]);
        console.log(`${sourcePeriod} periyotundan ${deleteResult.rowCount} iş silindi`);
      }

      client.release();

      res.json({
        message: `Taşıma işlemi tamamlandı`,
        movedCount,
        errorCount,
        errors: errors.length > 0 ? errors : undefined,
        sourcePeriod,
        targetPeriod
      });

    } catch (error) {
      client.release();
      throw error;
    }

  } catch (error) {
    console.error('Taşıma işlemi hatası:', error);
    res.status(500).json({ 
      error: 'Taşıma işlemi başarısız', 
      message: error.message,
      stack: error.stack
    });
  }
});

// Onay bekleyen işler endpoint'i
app.get('/api/control-items/pending-approvals', async (req, res) => {
  try {
    const { user } = req.query;
    console.log('Pending approvals request for user:', user);
    
    let query = `
      SELECT * FROM control_items 
      WHERE approval_status = 'pending' 
    `;
    
    // Eğer kullanıcı belirtilmişse, sadece o kullanıcının işlerini getir
    if (user && user !== 'admin') {
      query += ` AND user_name = $1`;
      query += ` ORDER BY date DESC`;
      const result = await pool.query(query, [user]);
      console.log('Found pending items for user:', result.rows.length);
      res.json(result.rows);
    } else {
      // Admin için tüm pending işleri getir
      query += ` ORDER BY date DESC`;
      const result = await pool.query(query);
      console.log('Found all pending items:', result.rows.length);
      res.json(result.rows);
    }
  } catch (error) {
    console.error('Onay bekleyen işler alınamadı:', error);
    res.status(500).json({ error: 'Onay bekleyen işler alınamadı', message: error.message });
  }
});

// İş onaylama endpoint'i
app.post('/api/control-items/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    // Admin kontrolü
    const userCheck = await pool.query('SELECT role FROM users WHERE username = $1', [approvedBy]);
    if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Sadece admin kullanıcıları onay işlemi yapabilir' });
    }

    const query = `
      UPDATE control_items 
      SET approval_status = 'approved', approved_by = $1, approved_at = NOW(), status = 'Tamamlandı' 
      WHERE id = $2
    `;
    
    const result = await pool.query(query, [approvedBy, id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'İş bulunamadı' });
    }

    res.json({ message: 'İş başarıyla onaylandı' });
  } catch (error) {
    console.error('İş onaylama hatası:', error);
    res.status(500).json({ error: 'İş onaylanamadı', message: error.message });
  }
});

// İş reddetme endpoint'i
app.post('/api/control-items/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectedBy, reason } = req.body;

    // Admin kontrolü
    const userCheck = await pool.query('SELECT role FROM users WHERE username = $1', [rejectedBy]);
    if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Sadece admin kullanıcıları reddetme işlemi yapabilir' });
    }

    const query = `
      UPDATE control_items 
      SET approval_status = 'rejected', approved_by = $1, approved_at = NOW(), rejection_reason = $2 
      WHERE id = $3
    `;
    
    const result = await pool.query(query, [rejectedBy, reason, id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'İş bulunamadı' });
    }

    res.json({ message: 'İş başarıyla reddedildi' });
  } catch (error) {
    console.error('İş reddetme hatası:', error);
    res.status(500).json({ error: 'İş reddedilemedi', message: error.message });
  }
});

// YBS İş Programı endpoint'leri
app.get('/api/ybs-work-items', async (req, res) => {
  try {
    console.log('YBS work items endpoint çağrıldı');
    
    // Önce tablo var mı kontrol et
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ybs_work_items'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('ybs_work_items tablosu bulunamadı, oluşturuluyor...');
      await initializeDatabase();
    }
    
    const result = await pool.query('SELECT * FROM ybs_work_items ORDER BY created_at DESC');
    console.log('YBS work items bulundu:', result.rows.length);
    
    // Verileri düzelt - responsible_users JSON'dan parse et
    const rows = result.rows.map(row => ({
      ...row,
      responsibleUsers: row.responsible_users ? JSON.parse(row.responsible_users) : [],
      requestingDepartment: row.requesting_department,
      requestDate: row.request_date,
      completionDate: row.completion_date,
      jiraNumber: row.jira_number,
      approvalStatus: row.approval_status,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json(rows);
  } catch (error) {
    console.error('YBS work items GET error:', error);
    res.status(500).json({ error: 'YBS işleri alınamadı', details: error.message });
  }
});

app.post('/api/ybs-work-items', async (req, res) => {
  try {
    const { 
      title, description, requestDate, completionDate, requestingDepartment, 
      responsibleUsers, jiraNumber, status, approvalStatus, createdBy 
    } = req.body;
    
    const query = `
      INSERT INTO ybs_work_items (
        title, description, request_date, completion_date, requesting_department,
        responsible_users, jira_number, status, approval_status, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *
    `;
    
    const params = [
      title, description, requestDate, completionDate, requestingDepartment,
      JSON.stringify(responsibleUsers), jiraNumber, status, approvalStatus, createdBy
    ];
    
    const result = await pool.query(query, params);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('YBS work items POST error:', error);
    res.status(500).json({ error: 'YBS işi oluşturulamadı', message: error.message });
  }
});

app.put('/api/ybs-work-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, description, requestDate, completionDate, requestingDepartment,
      responsibleUsers, jiraNumber, status, approvalStatus 
    } = req.body;
    
    const query = `
      UPDATE ybs_work_items 
      SET title = $1, description = $2, request_date = $3, completion_date = $4,
          requesting_department = $5, responsible_users = $6, jira_number = $7,
          status = $8, approval_status = $9, updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `;
    
    const params = [
      title, description, requestDate, completionDate, requestingDepartment,
      JSON.stringify(responsibleUsers), jiraNumber, status, approvalStatus, id
    ];
    
    const result = await pool.query(query, params);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'YBS işi bulunamadı' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('YBS work items PUT error:', error);
    res.status(500).json({ error: 'YBS işi güncellenemedi', message: error.message });
  }
});

app.delete('/api/ybs-work-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM ybs_work_items WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'YBS işi bulunamadı' });
    }
    
    res.json({ message: 'YBS işi başarıyla silindi' });
  } catch (error) {
    console.error('YBS work items DELETE error:', error);
    res.status(500).json({ error: 'YBS işi silinemedi', message: error.message });
  }
});

// Test verisi ekleme endpoint'i
app.post('/api/ybs-work-items/seed', async (req, res) => {
  try {
    const testData = [
      {
        title: 'Sistem Güncellemesi',
        description: 'Ana sistem güncellemesi ve güvenlik yamaları',
        requestDate: '2024-01-15',
        completionDate: '2024-01-20',
        requestingDepartment: 'Bilgi İşlem Müdürlüğü',
        responsibleUsers: ['Ahmet Yılmaz', 'Mehmet Demir'],
        jiraNumber: 'CITYPLUS-2024-001',
        status: 'completed',
        approvalStatus: 'pending',
        createdBy: 'admin'
      },
      {
        title: 'Veritabanı Optimizasyonu',
        description: 'Performans iyileştirmesi için veritabanı optimizasyonu',
        requestDate: '2024-01-10',
        completionDate: null,
        requestingDepartment: 'Teknoloji Müdürlüğü',
        responsibleUsers: ['Fatma Kaya'],
        jiraNumber: 'CITYPLUS-2024-002',
        status: 'in_progress',
        approvalStatus: 'pending',
        createdBy: 'admin'
      },
      {
        title: 'Kullanıcı Eğitimi',
        description: 'Yeni sistem kullanıcı eğitimi programı',
        requestDate: '2024-01-05',
        completionDate: null,
        requestingDepartment: 'İnsan Kaynakları Müdürlüğü',
        responsibleUsers: ['Ali Özkan', 'Ayşe Yıldız'],
        jiraNumber: 'CITYPLUS-2024-003',
        status: 'pending',
        approvalStatus: 'pending',
        createdBy: 'admin'
      }
    ];

    for (const item of testData) {
      const query = `
        INSERT INTO ybs_work_items (
          title, description, request_date, completion_date, requesting_department,
          responsible_users, jira_number, status, approval_status, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT DO NOTHING
      `;
      
      const params = [
        item.title, item.description, item.requestDate, item.completionDate, item.requestingDepartment,
        JSON.stringify(item.responsibleUsers), item.jiraNumber, item.status, item.approvalStatus, item.createdBy
      ];
      
      await pool.query(query, params);
    }
    
    res.json({ message: 'Test verisi başarıyla eklendi' });
  } catch (error) {
    console.error('Test verisi ekleme hatası:', error);
    res.status(500).json({ error: 'Test verisi eklenemedi', message: error.message });
  }
});

app.put('/api/ybs-work-items/:id/approval', async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalStatus, approvedBy, approvedAt } = req.body;
    
    const query = `
      UPDATE ybs_work_items 
      SET approval_status = $1, approved_by = $2, approved_at = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await pool.query(query, [approvalStatus, approvedBy, approvedAt, id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'YBS işi bulunamadı' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('YBS work items approval PUT error:', error);
    res.status(500).json({ error: 'YBS işi onayı güncellenemedi', message: error.message });
  }
});

// LocalStorage'dan veri import etme endpoint'i
app.post('/api/import-localstorage', async (req, res) => {
  try {
    const { facilities, bagtvFacilities, controlItems, messages } = req.body;
    console.log('Import request received:', { 
      facilities: facilities?.length || 0, 
      bagtvFacilities: bagtvFacilities?.length || 0, 
      controlItems: controlItems?.length || 0, 
      messages: messages?.length || 0 
    });

    const imported = {
      facilities: 0,
      bagtvFacilities: 0,
      controlItems: 0,
      messages: 0
    };

    // Tesisleri import et
    if (facilities && facilities.length > 0) {
      for (const facility of facilities) {
        try {
          await pool.query(
            'INSERT INTO facilities (name, description, status) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
            [facility.name, facility.description, facility.status || 'active']
          );
          imported.facilities++;
        } catch (error) {
          console.error('Facility import error:', error);
        }
      }
    }

    // BagTV Tesislerini import et
    if (bagtvFacilities && bagtvFacilities.length > 0) {
      for (const facility of bagtvFacilities) {
        try {
          await pool.query(
            'INSERT INTO bagtv_facilities (name, tv_count, description, status) VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO NOTHING',
            [facility.name, facility.tvCount || 0, facility.description, facility.status || 'Aktif']
          );
          imported.bagtvFacilities++;
        } catch (error) {
          console.error('BagTV facility import error:', error);
        }
      }
    }

    // Kontrol öğelerini import et
    if (controlItems && controlItems.length > 0) {
      for (const item of controlItems) {
        try {
          await pool.query(
            'INSERT INTO control_items (title, description, period, date, user_name, facility_id, status, work_done) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING',
            [
              item.title,
              item.description,
              item.period,
              item.date,
              item.user_name || item.user,
              item.facility_id,
              item.status || 'Beklemede',
              item.work_done || ''
            ]
          );
          imported.controlItems++;
        } catch (error) {
          console.error('Control item import error:', error);
        }
      }
    }

    // Mesajları import et
    if (messages && messages.length > 0) {
      for (const message of messages) {
        try {
          await pool.query(
            'INSERT INTO messages (description, total_count, pulled_count, date, account) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
            [
              message.description,
              message.totalCount || 0,
              message.pulledCount || 0,
              message.date,
              message.account || ''
            ]
          );
          imported.messages++;
        } catch (error) {
          console.error('Message import error:', error);
        }
      }
    }

    console.log('Import completed:', imported);
    res.json({ 
      message: 'Veriler başarıyla import edildi', 
      imported 
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Import işlemi başarısız oldu', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`PostgreSQL sunucusu http://localhost:${PORT} adresinde çalışıyor`);
});

module.exports = app; 