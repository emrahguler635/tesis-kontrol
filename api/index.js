const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL bağlantısı - Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
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
    console.log('Login attempt:', req.body);
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ success: false, error: 'Kullanıcı adı ve şifre gerekli' });
    }
    
    // Basit kontrol
    if (username === 'admin' && password === 'admin123') {
      console.log('Login successful for user:', username);
      res.json({
        success: true,
        id: 'admin-id',
        username: 'admin',
        email: 'admin@admin.com',
        role: 'admin',
        permissions: [
          'Ana Sayfa', 'Tesisler', 'Günlük İş Programı', 'Toplam Yapılan İşler', 
          'Raporlar', 'Mesaj Yönetimi', 'BağTV', 'Veri Kontrol', 'Onay Yönetimi', 
          'Yapılan İşler', 'Ayarlar', 'Kullanıcı Yönetimi'
        ]
      });
    } else {
      console.log('Login failed: Invalid credentials');
      res.status(401).json({ success: false, error: 'Kullanıcı adı veya şifre hatalı' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

// Facilities endpoints
app.get('/api/facilities', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM facilities ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Facilities error:', error);
    res.status(500).json({ error: 'Facilities alınamadı' });
  }
});

app.post('/api/facilities', async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const result = await pool.query(
      'INSERT INTO facilities (name, description, status, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *',
      [name, description, status || 'active']
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
    const { name, description, status } = req.body;
    const result = await pool.query(
      'UPDATE facilities SET name = $1, description = $2, status = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [name, description, status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Facility bulunamadı.' });
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
      return res.status(404).json({ error: 'Facility bulunamadı.' });
    }
    res.json({ message: 'Facility silindi', id });
  } catch (error) {
    console.error('Facility delete error:', error);
    res.status(500).json({ error: 'Facility silinemedi' });
  }
});

// Control Items endpoints
app.get('/api/control-items', async (req, res) => {
  try {
    const { period, user } = req.query;
    let query = 'SELECT * FROM control_items';
    let params = [];
    let conditions = [];

    if (period) {
      conditions.push(`period = $${params.length + 1}`);
      params.push(period);
    }

    if (user && user !== 'admin') {
      conditions.push(`user_name = $${params.length + 1}`);
      params.push(user);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY date DESC';
    const result = await pool.query(query, params);
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
    console.log('Control item update request body:', req.body);
    
    // Status değişikliğinde onay durumunu güncelle
    let approvalStatus = 'pending';
    if (status === 'Tamamlandı') {
      approvalStatus = 'pending'; // Onay bekliyor
    } else if (status === 'Beklemede') {
      approvalStatus = 'pending'; // Onay bekliyor
    } else if (status === 'İptal') {
      approvalStatus = 'rejected'; // Reddedildi
    }

    const userName = user || 'Kullanıcı Belirtilmemiş';
    console.log('Using user name:', userName);

    const result = await pool.query(
      `UPDATE control_items SET 
       title = $1, description = $2, period = $3, date = $4, facility_id = $5, 
       work_done = $6, user_name = $7, status = $8, approval_status = $9, updated_at = NOW() 
       WHERE id = $10 RETURNING *`,
      [title, description, period, date, facilityId, workDone, userName, status, approvalStatus, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Control item bulunamadı.' });
    }
    
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

// Users endpoints
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

// Messages endpoints
app.get('/api/messages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Messages error:', error);
    res.status(500).json({ error: 'Messages alınamadı' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { date, totalCount, pulledCount, description, account } = req.body;
    const result = await pool.query(
      'INSERT INTO messages (date, total_count, pulled_count, description, account, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [date, totalCount, pulledCount, description, account]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Message create error:', error);
    res.status(500).json({ error: 'Message oluşturulamadı' });
  }
});

app.put('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, totalCount, pulledCount, description, account } = req.body;
    const result = await pool.query(
      'UPDATE messages SET date = $1, total_count = $2, pulled_count = $3, description = $4, account = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
      [date, totalCount, pulledCount, description, account, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message bulunamadı.' });
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
    const result = await pool.query('DELETE FROM messages WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message bulunamadı.' });
    }
    res.json({ message: 'Message silindi', id });
  } catch (error) {
    console.error('Message delete error:', error);
    res.status(500).json({ error: 'Message silinemedi' });
  }
});

// Mesaj istatistikleri endpoint'i
app.get('/api/messages/stats', async (req, res) => {
  try {
    // Vercel'de veritabanı bağlantısı yoksa mock data kullan
    if (!process.env.DATABASE_URL) {
      const mockMessages = [
        { total_count: 13333, pulled_count: 13333 },
        { total_count: 12, pulled_count: 12 },
        { total_count: 2, pulled_count: 2 },
        { total_count: 1, pulled_count: 1 },
        { total_count: 12, pulled_count: 11 }
      ];
      
      const totalMessages = mockMessages.length;
      const totalCount = mockMessages.reduce((sum, msg) => sum + (msg.total_count || 0), 0);
      const pulledCount = mockMessages.reduce((sum, msg) => sum + (msg.pulled_count || 0), 0);
      const successRate = totalCount > 0 ? parseFloat(((pulledCount / totalCount) * 100).toFixed(1)) : 0;
      
      return res.json({
        totalMessages,
        totalCount,
        pulledCount,
        successRate,
        messageLog: totalMessages
      });
    }
    
    const result = await pool.query('SELECT * FROM messages');
    const messages = result.rows;
    
    const totalMessages = messages.length;
    const totalCount = messages.reduce((sum, msg) => sum + (msg.total_count || 0), 0);
    const pulledCount = messages.reduce((sum, msg) => sum + (msg.pulled_count || 0), 0);
    const successRate = totalCount > 0 ? parseFloat(((pulledCount / totalCount) * 100).toFixed(1)) : 0;
    
    res.json({
      totalMessages,
      totalCount,
      pulledCount,
      successRate,
      messageLog: totalMessages
    });
  } catch (error) {
    console.error('Message stats error:', error);
    res.status(500).json({ error: 'Mesaj istatistikleri alınamadı' });
  }
});

// Onay bekleyen işler endpoint'i
app.get('/api/control-items/pending-approvals', async (req, res) => {
  try {
    const { user } = req.query;
    console.log('Pending approvals request for user:', user);
    
    let query = 'SELECT * FROM control_items WHERE approval_status = $1';
    let params = ['pending'];
    
    // Eğer kullanıcı belirtilmişse ve admin değilse, sadece o kullanıcının işlerini getir
    if (user && user !== 'admin') {
      query += ' AND user_name = $2';
      params.push(user);
    }
    
    query += ' ORDER BY date DESC';
    const result = await pool.query(query, params);
    console.log('Found pending items:', result.rows.length);
    res.json(result.rows);
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

    console.log('Onay isteği:', { id, approvedBy });

    // Admin kontrolü
    if (approvedBy !== 'admin') {
      return res.status(403).json({ error: 'Sadece admin kullanıcıları onay işlemi yapabilir' });
    }

    const result = await pool.query(
      `UPDATE control_items SET 
       approval_status = 'approved', 
       approved_by = $1, 
       approved_at = NOW() 
       WHERE id = $2 RETURNING *`,
      [approvedBy, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'İş bulunamadı' });
    }

    console.log('İş başarıyla onaylandı:', result.rows[0].id);
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

    console.log('Red isteği:', { id, rejectedBy, reason });

    // Admin kontrolü
    if (rejectedBy !== 'admin') {
      return res.status(403).json({ error: 'Sadece admin kullanıcıları reddetme işlemi yapabilir' });
    }

    const result = await pool.query(
      `UPDATE control_items SET 
       approval_status = 'rejected', 
       approved_by = $1, 
       approved_at = NOW(),
       rejection_reason = $2 
       WHERE id = $3 RETURNING *`,
      [rejectedBy, reason, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'İş bulunamadı' });
    }

    console.log('İş başarıyla reddedildi:', result.rows[0].id);
    res.json({ message: 'İş başarıyla reddedildi' });
  } catch (error) {
    console.error('İş reddetme hatası:', error);
    res.status(500).json({ error: 'İş reddedilemedi', message: error.message });
  }
});

// WhatsApp API'sini dahil et
require('./whatsapp')(app);

module.exports = app; 