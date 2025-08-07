const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:4173',
    'http://localhost:5173',
    'https://tesis-kontrol.vercel.app',
    'https://tesis-kontrol-*.vercel.app',
    'https://*.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// PostgreSQL bağlantısı - Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Tesis Kontrol API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server çalışıyor!',
    timestamp: new Date().toISOString()
  });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Database'den kullanıcıyı kontrol et
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.json({
        success: true,
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: ['Ana Sayfa', 'Tesisler', 'Günlük İş Programı', 'Toplam Yapılan İşler', 'Raporlar', 'Mesaj Yönetimi', 'BağTV', 'Veri Kontrol', 'Onay Yönetimi', 'Yapılan İşler', 'Ayarlar', 'Kullanıcı Yönetimi']
      });
    } else {
      res.json({
        success: false,
        error: 'Kullanıcı adı veya şifre hatalı!'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login hatası' });
  }
});

// Messages endpoints
app.get('/api/messages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM messages ORDER BY date DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Messages get error:', error);
    res.status(500).json({ error: 'Messages alınamadı' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { date, total_count, pulled_count, return_count, description, account, sender } = req.body;
    
    const result = await pool.query(`
      INSERT INTO messages (date, total_count, pulled_count, return_count, description, account, sender)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [date, total_count, pulled_count, return_count, description, account, sender]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Message create error:', error);
    res.status(500).json({ error: 'Message oluşturulamadı' });
  }
});

app.put('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, total_count, pulled_count, return_count, description, account, sender } = req.body;
    
    const result = await pool.query(`
      UPDATE messages 
      SET date = $1, total_count = $2, pulled_count = $3, return_count = $4, description = $5, account = $6, sender = $7
      WHERE id = $8
      RETURNING *
    `, [date, total_count, pulled_count, return_count, description, account, sender, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message bulunamadı' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Message update error:', error);
    res.status(500).json({ error: 'Message güncellenemedi' });
  }
});

app.delete('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM messages WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message bulunamadı' });
    }
    
    res.json({ message: 'Message silindi' });
  } catch (error) {
    console.error('Message delete error:', error);
    res.status(500).json({ error: 'Message silinemedi' });
  }
});

// Messages setup
app.post('/api/messages/setup', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        total_count INTEGER NOT NULL,
        pulled_count INTEGER NOT NULL,
        return_count INTEGER DEFAULT 0,
        description TEXT,
        account VARCHAR(200),
        sender VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    res.json({ message: 'Messages tablosu oluşturuldu' });
  } catch (error) {
    console.error('Messages setup error:', error);
    res.status(500).json({ error: 'Messages tablosu oluşturulamadı' });
  }
});

// Control items endpoints
app.get('/api/control-items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM control_items ORDER BY date DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Control items error:', error);
    res.status(500).json({ error: 'Control items alınamadı' });
  }
});

app.post('/api/control-items', async (req, res) => {
  try {
    const { title, description, period, date, facilityId, workDone, user, status } = req.body;
    const result = await pool.query(
      `INSERT INTO control_items (title, description, period, date, facility_id, work_done, user_name, status, approval_status, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW()) RETURNING *`,
      [title, description, period, date, facilityId, workDone, user, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Control item create error:', error);
    res.status(500).json({ error: 'Control item oluşturulamadı' });
  }
});

app.put('/api/control-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, period, date, facilityId, workDone, user, status } = req.body;
    
    const result = await pool.query(
      `UPDATE control_items SET 
       title = $1, description = $2, period = $3, date = $4, facility_id = $5, 
       work_done = $6, user_name = $7, status = $8, updated_at = NOW() 
       WHERE id = $9 RETURNING *`,
      [title, description, period, date, facilityId, workDone, user, status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Control item bulunamadı.' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Control item update error:', error);
    res.status(500).json({ error: 'Control item güncellenemedi' });
  }
});

app.delete('/api/control-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM control_items WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Control item bulunamadı.' });
    }
    res.json({ message: 'Control item silindi', id });
  } catch (error) {
    console.error('Control item delete error:', error);
    res.status(500).json({ error: 'Control item silinemedi' });
  }
});

// Facilities endpoints
app.get('/api/facilities', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM facilities ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Facilities error:', error);
    res.status(500).json({ error: 'Facilities alınamadı' });
  }
});

app.post('/api/facilities', async (req, res) => {
  try {
    const { name, description, location } = req.body;
    const result = await pool.query(
      'INSERT INTO facilities (name, description, location) VALUES ($1, $2, $3) RETURNING *',
      [name, description, location]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Facility create error:', error);
    res.status(500).json({ error: 'Facility oluşturulamadı' });
  }
});

app.put('/api/facilities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, location } = req.body;
    const result = await pool.query(
      'UPDATE facilities SET name = $1, description = $2, location = $3 WHERE id = $4 RETURNING *',
      [name, description, location, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Facility bulunamadı' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Facility update error:', error);
    res.status(500).json({ error: 'Facility güncellenemedi' });
  }
});

app.delete('/api/facilities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM facilities WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Facility bulunamadı' });
    }
    
    res.json({ message: 'Facility silindi', id });
  } catch (error) {
    console.error('Facility delete error:', error);
    res.status(500).json({ error: 'Facility silinemedi' });
  }
});

// Database setup
app.post('/api/setup-database', async (req, res) => {
  try {
    // Users tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        email VARCHAR(200),
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Facilities tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS facilities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        location VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Control items tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS control_items (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        period VARCHAR(20) NOT NULL,
        date DATE NOT NULL,
        facility_id INTEGER REFERENCES facilities(id),
        work_done TEXT,
        user_name VARCHAR(100),
        status VARCHAR(20) DEFAULT 'pending',
        approval_status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Messages tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        total_count INTEGER NOT NULL,
        pulled_count INTEGER NOT NULL,
        return_count INTEGER DEFAULT 0,
        description TEXT,
        account VARCHAR(200),
        sender VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // BağTV Facilities tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bagtv_facilities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        tv_count INTEGER DEFAULT 1,
        description TEXT,
        status VARCHAR(20) DEFAULT 'Aktif',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // BağTV Controls tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bagtv_controls (
        id SERIAL PRIMARY KEY,
        facility_id INTEGER REFERENCES bagtv_facilities(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        action TEXT NOT NULL,
        description TEXT,
        checked_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // YBS Work Items tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ybs_work_items (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        request_date DATE NOT NULL,
        completion_date DATE,
        requesting_department VARCHAR(100),
        responsible_users JSONB DEFAULT '[]',
        jira_number VARCHAR(50),
        status VARCHAR(20) DEFAULT 'pending',
        approval_status VARCHAR(20) DEFAULT 'pending',
        approved_by VARCHAR(100),
        approved_at TIMESTAMP,
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Admin kullanıcısını ekle (eğer yoksa)
    await pool.query(`
      INSERT INTO users (username, password, email, role) 
      VALUES ('admin', 'admin', 'admin@example.com', 'admin')
      ON CONFLICT (username) DO NOTHING
    `);

    // Örnek BağTV tesisleri ekle
    await pool.query(`
      INSERT INTO bagtv_facilities (name, tv_count, description, status) 
      VALUES 
        ('BagTV Merkez', 15, 'Merkez BagTV tesisleri - Ana kontrol merkezi', 'Aktif'),
        ('BagTV Şube 1', 8, 'Şube 1 BagTV tesisleri - Güney bölgesi', 'Aktif'),
        ('BagTV Şube 2', 12, 'Şube 2 BagTV tesisleri - Kuzey bölgesi', 'Aktif'),
        ('BagTV Eğitim Merkezi', 5, 'Eğitim merkezi BagTV tesisleri', 'Aktif')
      ON CONFLICT (name) DO NOTHING
    `);

    res.json({ message: 'Veritabanı tabloları oluşturuldu ve örnek veriler eklendi' });
  } catch (error) {
    console.error('Database setup error:', error);
    res.status(500).json({ error: 'Veritabanı kurulumu başarısız' });
  }
});

// BağTV Facilities endpoints
app.get('/api/bagtv-facilities', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bagtv_facilities ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('BagTV facilities error:', error);
    res.status(500).json({ error: 'BagTV facilities alınamadı' });
  }
});

app.post('/api/bagtv-facilities', async (req, res) => {
  try {
    const { name, tvCount, description, status } = req.body;
    const result = await pool.query(
      'INSERT INTO bagtv_facilities (name, tv_count, description, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, tvCount, description, status || 'Aktif']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('BagTV facility create error:', error);
    res.status(500).json({ error: 'BagTV facility oluşturulamadı' });
  }
});

app.put('/api/bagtv-facilities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, tvCount, description, status } = req.body;
    const result = await pool.query(
      'UPDATE bagtv_facilities SET name = $1, tv_count = $2, description = $3, status = $4 WHERE id = $5 RETURNING *',
      [name, tvCount, description, status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'BagTV facility bulunamadı.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('BagTV facility update error:', error);
    res.status(500).json({ error: 'BagTV facility güncellenemedi' });
  }
});

app.delete('/api/bagtv-facilities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM bagtv_facilities WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'BagTV facility bulunamadı.' });
    }
    res.json({ message: 'BagTV facility silindi', id });
  } catch (error) {
    console.error('BagTV facility delete error:', error);
    res.status(500).json({ error: 'BagTV facility silinemedi' });
  }
});

// BağTV Controls endpoints
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
      return res.status(404).json({ error: 'Kontrol bulunamadı' });
    }
    
    res.status(200).json({ message: 'Kayıt başarıyla silindi' });
  } catch (error) {
    console.error('BagTV controls DELETE error:', error);
    res.status(500).json({ error: 'Kayıt silinirken hata oluştu' });
  }
});

// YBS Work Items endpoints
app.get('/api/ybs-work-items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ybs_work_items ORDER BY created_at DESC');
    
    // Verileri düzelt - responsible_users JSON'dan parse et
    const rows = result.rows.map(row => {
      let responsibleUsers = [];
      try {
        if (row.responsible_users) {
          if (typeof row.responsible_users === 'string') {
            responsibleUsers = JSON.parse(row.responsible_users);
          } else {
            responsibleUsers = row.responsible_users;
          }
        }
      } catch (error) {
        console.error('JSON parse error for responsible_users:', error);
        responsibleUsers = [];
      }
      
      return {
        ...row,
        responsibleUsers,
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
      };
    });
    
    res.json(rows);
  } catch (error) {
    console.error('YBS work items GET error:', error);
    res.status(500).json({ error: 'YBS işleri alınamadı', details: error.message });
  }
});

app.post('/api/ybs-work-items', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      requestDate, 
      completionDate, 
      requestingDepartment, 
      responsibleUsers, 
      jiraNumber, 
      status, 
      approvalStatus, 
      createdBy 
    } = req.body;
    
    const query = `
      INSERT INTO ybs_work_items (
        title, description, request_date, completion_date, requesting_department,
        responsible_users, jira_number, status, approval_status, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *
    `;
    
    const params = [
      title, 
      description, 
      requestDate, 
      completionDate, 
      requestingDepartment, 
      JSON.stringify(responsibleUsers || []), 
      jiraNumber, 
      status || 'pending', 
      approvalStatus || 'pending', 
      createdBy
    ];
    
    const result = await pool.query(query, params);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('YBS work items POST error:', error);
    res.status(500).json({ error: 'YBS işi oluşturulamadı', details: error.message });
  }
});

app.put('/api/ybs-work-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      requestDate, 
      completionDate, 
      requestingDepartment, 
      responsibleUsers, 
      jiraNumber, 
      status, 
      approvalStatus 
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
      title, 
      description, 
      requestDate, 
      completionDate, 
      requestingDepartment, 
      JSON.stringify(responsibleUsers || []), 
      jiraNumber, 
      status, 
      approvalStatus, 
      id
    ];
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'YBS işi bulunamadı' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('YBS work items PUT error:', error);
    res.status(500).json({ error: 'YBS işi güncellenemedi', details: error.message });
  }
});

app.delete('/api/ybs-work-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM ybs_work_items WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'YBS işi bulunamadı' });
    }
    
    res.json({ message: 'YBS işi silindi', id });
  } catch (error) {
    console.error('YBS work items DELETE error:', error);
    res.status(500).json({ error: 'YBS işi silinemedi', details: error.message });
  }
});

// YBS Work Item Approval endpoint
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
    
    const params = [approvalStatus, approvedBy, approvedAt, id];
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'YBS işi bulunamadı' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('YBS work item approval error:', error);
    res.status(500).json({ error: 'YBS işi onaylanamadı', details: error.message });
  }
});

// Users endpoints (for getUsers function)
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ error: 'Users alınamadı' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, username, email, role, created_at',
      [username, email, password, role || 'user']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('User create error:', error);
    res.status(500).json({ error: 'User oluşturulamadı' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, role } = req.body;
    let query = 'UPDATE users SET username = $1, email = $2, role = $3';
    let params = [username, email, role];
    
    if (password) {
      query += ', password = $4';
      params.push(password);
    }
    
    query += ', updated_at = NOW() WHERE id = $' + (params.length + 1) + ' RETURNING id, username, email, role, created_at';
    params.push(id);
    
    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User bulunamadı.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ error: 'User güncellenemedi' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User bulunamadı.' });
    }
    res.json({ message: 'User silindi', id });
  } catch (error) {
    console.error('User delete error:', error);
    res.status(500).json({ error: 'User silinemedi' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app; 