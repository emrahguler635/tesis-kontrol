const { Pool } = require('pg');

module.exports = (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // PostgreSQL bağlantısı
  let pool = null;
  if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }

  if (!pool) {
    return res.status(500).json({ error: 'Database bağlantısı yok' });
  }

  if (req.method === 'GET') {
    const { facilityId } = req.query;
    
    let query = 'SELECT * FROM bagtv_controls';
    let params = [];
    
    if (facilityId) {
      query += ' WHERE facility_id = $1';
      params.push(facilityId);
    }
    
    query += ' ORDER BY created_at DESC';
    
    pool.query(query, params, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database hatası' });
      } else {
        res.status(200).json(result.rows);
      }
    });
  } else if (req.method === 'POST') {
    const { facilityId, date, action, description, checkedBy } = req.body;
    
    const query = `
      INSERT INTO bagtv_controls (facility_id, date, action, description, checked_by, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    
    const params = [facilityId, date, action, description, checkedBy];
    
    pool.query(query, params, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Kayıt eklenirken hata oluştu' });
      } else {
        res.status(201).json(result.rows[0]);
      }
    });
  } else if (req.method === 'DELETE') {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'ID gerekli' });
    }
    
    const query = 'DELETE FROM bagtv_controls WHERE id = $1';
    
    pool.query(query, [id], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Kayıt silinirken hata oluştu' });
      } else {
        res.status(200).json({ message: 'Kayıt başarıyla silindi' });
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}; 