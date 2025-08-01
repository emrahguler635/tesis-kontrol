const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL bağlantısı
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
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



// Tüm tabloları oluştur ve admin kullanıcısını ekle
async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    // Tabloları kontrol et ve yoksa oluştur
    
    // Users tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        permissions JSONB DEFAULT '[]',
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
    
    // Control Items tablosu
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
        rejection_reason TEXT,
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
        sender VARCHAR(100) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Eğer messages tablosu varsa ve sender kolonu yoksa ekle
    try {
      await client.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender VARCHAR(100) DEFAULT \'admin\'');
    } catch (error) {
      console.log('Sender kolonu zaten mevcut veya eklenemedi:', error.message);
    }
    
    // Eğer control_items tablosu varsa ve rejection_reason kolonu yoksa ekle
    try {
      await client.query('ALTER TABLE control_items ADD COLUMN IF NOT EXISTS rejection_reason TEXT');
    } catch (error) {
      console.log('Rejection_reason kolonu zaten mevcut veya eklenemedi:', error.message);
    }
    
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
    console.log('Tüm tablolar başarıyla oluşturuldu');
  } catch (error) {
    console.error('Veritabanı başlatma hatası:', error);
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
    const { title, description, period, date, facilityId, workDone, user, status } = req.body;
    console.log('Control item request body:', req.body);
    
    const result = await pool.query(
      'INSERT INTO control_items (title, description, period, date, facility_id, work_done, user_name, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [title, description, period, date, facilityId, workDone, user, status]
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
    const { title, description, period, date, facilityId, workDone, user, status } = req.body;
    console.log('Control item update request body:', req.body);
    
    // Status değişikliğinde onay durumunu güncelle
    let approvalStatus = 'pending';
    if (status === 'Tamamlandı') {
      approvalStatus = 'approved'; // Otomatik onaylandı
    } else if (status === 'Beklemede') {
      approvalStatus = 'pending'; // Onay bekliyor
    } else if (status === 'İptal') {
      approvalStatus = 'rejected'; // Reddedildi
    }

    const userName = user || 'Kullanıcı Belirtilmemiş';
    console.log('Using user name:', userName);

    // facilityId'yi facility_id'ye dönüştür
    const facility_id = facilityId || 1;

    const result = await pool.query(
      'UPDATE control_items SET title = $1, description = $2, period = $3, date = $4, facility_id = $5, work_done = $6, user_name = $7, status = $8, approval_status = $9 WHERE id = $10 RETURNING *',
      [title, description, period, date, facility_id, workDone, userName, status, approvalStatus, id]
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
      SET approval_status = 'approved', approved_by = $1, approved_at = NOW() 
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

app.listen(PORT, () => {
  console.log(`PostgreSQL sunucusu http://localhost:${PORT} adresinde çalışıyor`);
});

module.exports = app; 