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



// Tüm tabloları oluştur ve admin kullanıcısını ekle
async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    // Eski tabloları sil ve yeniden oluştur
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
    
    // Control Items tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS control_items (
        id SERIAL PRIMARY KEY,
        facility_id INTEGER REFERENCES facilities(id),
        item_name VARCHAR(100) NOT NULL,
        description TEXT,
        frequency VARCHAR(20) DEFAULT 'Günlük',
        date DATE,
        work_done TEXT,
        user_name VARCHAR(100),
        status VARCHAR(20) DEFAULT 'Aktif',
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
    const result = await pool.query('SELECT * FROM control_items ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Control items alınamadı' });
  }
});

app.post('/api/control-items', async (req, res) => {
  try {
    const { title, description, period, date, facilityId, workDone, user, status } = req.body;
    console.log('Control item request body:', req.body);
    
    const result = await pool.query(
      'INSERT INTO control_items (item_name, description, frequency, date, facility_id, work_done, user_name, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [title, description, period, date, facilityId, workDone, user, status]
    );
    console.log('Control item created:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Control item creation error:', error);
    res.status(500).json({ error: 'Control item oluşturulamadı', message: error.message });
  }
});

app.get('/api/messages', async (req, res) => {
  try {
    console.log('Messages GET endpoint called');
    const result = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
    console.log('Messages query result:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Messages GET error:', error);
    res.status(500).json({ error: 'Messages alınamadı', message: error.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { date, totalCount, pulledCount, account, description } = req.body;
    console.log('Message request body:', req.body);
    
    const result = await pool.query(
      'INSERT INTO messages (date, total_count, pulled_count, account, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [date, totalCount, pulledCount, account, description]
    );
    console.log('Message created:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Message creation error:', error);
    res.status(500).json({ error: 'Message oluşturulamadı', message: error.message });
  }
});

// User endpoints
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Users alınamadı' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    console.log('User request body:', req.body);
    
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
      [username, email, password, role]
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
    const { username, email, password, role } = req.body;
    
    let query, params;
    if (password) {
      query = 'UPDATE users SET username = $1, email = $2, password = $3, role = $4 WHERE id = $5 RETURNING id, username, email, role, created_at';
      params = [username, email, password, role, id];
    } else {
      query = 'UPDATE users SET username = $1, email = $2, role = $3 WHERE id = $4 RETURNING id, username, email, role, created_at';
      params = [username, email, role, id];
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'User güncellenemedi' });
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
        item_name VARCHAR(100) NOT NULL,
        description TEXT,
        frequency VARCHAR(20) DEFAULT 'Günlük',
        date DATE,
        work_done TEXT,
        user_name VARCHAR(100),
        status VARCHAR(20) DEFAULT 'Aktif',
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

app.listen(PORT, () => {
  console.log(`PostgreSQL sunucusu http://localhost:${PORT} adresinde çalışıyor`);
});

module.exports = app; 