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

  if (req.method === 'GET') {
    // Eğer query parametresi varsa kontrol sayılarını da getir
    if (req.query.withControlCounts === 'true') {
      if (!pool) {
        return res.status(500).json({ error: 'Database bağlantısı yok' });
      }

      // Tüm kontrol tablolarından kontrol sayılarını al
      const query = `
        SELECT 
          f.id,
          f.name,
          f.description,
          f.status,
          f.tv_count as "tvCount",
          f.created_at,
          f.updated_at,
          COALESCE(
            (SELECT COUNT(*) FROM control_items ci WHERE ci.facility_id = f.id::text OR ci.facility_id = f.id::text), 0
          ) +
          COALESCE(
            (SELECT COUNT(*) FROM bagtv_controls bc WHERE bc.facility_id = f.id::text OR bc.facility_id = f.id::text), 0
          ) +
          COALESCE(
            (SELECT COUNT(*) FROM ybs_work_items yw WHERE yw.facility_id = f.id::text OR yw.facility_id = f.id::text), 0
          ) as control_count
        FROM facilities f
        ORDER BY f.id
      `;

      pool.query(query, (err, result) => {
        if (err) {
          console.error('Database error:', err);
          res.status(500).json({ error: 'Database hatası' });
        } else {
          res.status(200).json(result.rows);
        }
      });
    } else {
      // Normal facilities endpoint
      if (!pool) {
        // Mock data fallback
        const mockFacilities = [
          {
            id: 1,
            name: 'Merkez Ofis',
            description: 'Ana merkez ofis',
            status: 'active',
            tvCount: 3,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 2,
            name: 'Şube Ofis',
            description: 'Şube ofis',
            status: 'active',
            tvCount: 2,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        res.status(200).json(mockFacilities);
        return;
      }

      const query = 'SELECT * FROM facilities ORDER BY id';
      pool.query(query, (err, result) => {
        if (err) {
          console.error('Database error:', err);
          res.status(500).json({ error: 'Database hatası' });
        } else {
          res.status(200).json(result.rows);
        }
      });
    }
  } else if (req.method === 'POST') {
    if (!pool) {
      return res.status(500).json({ error: 'Database bağlantısı yok' });
    }

    const { name, description, status, tvCount } = req.body;
    
    const query = `
      INSERT INTO facilities (name, description, status, tv_count, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    
    const params = [name, description || 'active', status || 'active', tvCount || 0];
    
    pool.query(query, params, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Tesis eklenirken hata oluştu' });
      } else {
        res.status(201).json(result.rows[0]);
      }
    });
  } else if (req.method === 'PUT') {
    if (!pool) {
      return res.status(500).json({ error: 'Database bağlantısı yok' });
    }

    const urlParts = req.url.split('/');
    const facilityId = parseInt(urlParts[urlParts.length - 1]);
    const { name, description, status, tvCount } = req.body;
    
    const query = `
      UPDATE facilities 
      SET name = $1, description = $2, status = $3, tv_count = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;
    
    const params = [name, description, status, tvCount, facilityId];
    
    pool.query(query, params, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Tesis güncellenirken hata oluştu' });
      } else if (result.rows.length === 0) {
        res.status(404).json({ error: 'Tesis bulunamadı' });
      } else {
        res.status(200).json(result.rows[0]);
      }
    });
  } else if (req.method === 'DELETE') {
    if (!pool) {
      return res.status(500).json({ error: 'Database bağlantısı yok' });
    }

    const urlParts = req.url.split('/');
    const facilityId = parseInt(urlParts[urlParts.length - 1]);
    
    const query = 'DELETE FROM facilities WHERE id = $1 RETURNING *';
    
    pool.query(query, [facilityId], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Tesis silinirken hata oluştu' });
      } else if (result.rows.length === 0) {
        res.status(404).json({ error: 'Tesis bulunamadı' });
      } else {
        res.status(200).json({ message: 'Tesis başarıyla silindi' });
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}; 