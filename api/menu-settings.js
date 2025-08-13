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
    // Menü ayarlarını getir
    if (!pool) {
      return res.status(500).json({ error: 'Database bağlantısı yok' });
    }

    const query = `
      SELECT menu_items FROM app_settings WHERE id = 1
    `;

    pool.query(query, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database hatası' });
      } else {
        if (result.rows.length > 0) {
          res.status(200).json({ menuItems: result.rows[0].menu_items || [] });
        } else {
          // Varsayılan menü öğeleri
          const defaultMenuItems = [
            { id: 'home', label: 'Ana Sayfa', icon: '🏠', to: '/', enabled: true },
            { id: 'facilities', label: 'Tesisler', icon: '🏢', to: '/facilities', enabled: true },
            { id: 'daily', label: 'Günlük İş Programı', icon: '📅', to: '/daily-checks', enabled: true },
            { id: 'weekly', label: 'Toplam Yapılan İşler', icon: '⏰', to: '/haftalik', enabled: true },
            { id: 'ybs-work-program', label: 'YBS İş Programı', icon: '📋', to: '/ybs-work-program', enabled: true },
            { id: 'ybs-approvals', label: 'YBS Onay Ekranları', icon: '✅', to: '/ybs-approvals', enabled: true },
            { id: 'reports', label: 'Raporlar', icon: '📊', to: '/reports', enabled: true },
            { id: 'messages', label: 'Mesaj Yönetimi', icon: '💬', to: '/messages', enabled: true },
            { id: 'bagtv', label: 'BağTV Yönetim', icon: '📺', to: '/bagtv', enabled: true },
            { id: 'data-control', label: 'Veri Kontrol', icon: '🗄️', to: '/data-control', enabled: true },
            { id: 'approvals', label: 'Onay Yönetimi', icon: '✅', to: '/approvals', enabled: true },
            { id: 'completed-works', label: 'Yapılan İşler', icon: '✅', to: '/completed-works', enabled: true },
            { id: 'user-management', label: 'Kullanıcı Yönetimi', icon: '👥', to: '/user-management', enabled: true },
            { id: 'whatsapp', label: 'WhatsApp Bildirimleri', icon: '📱', to: '/whatsapp', enabled: true },
            { id: 'settings', label: 'Ayarlar', icon: '⚙️', to: '/settings', enabled: true }
          ];
          res.status(200).json({ menuItems: defaultMenuItems });
        }
      }
    });
  } else if (req.method === 'POST') {
    // Menü ayarlarını kaydet
    if (!pool) {
      return res.status(500).json({ error: 'Database bağlantısı yok' });
    }

    const { menuItems } = req.body;

    if (!menuItems || !Array.isArray(menuItems)) {
      return res.status(400).json({ error: 'Geçersiz menü öğeleri' });
    }

    // Önce tabloyu oluştur (eğer yoksa)
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS app_settings (
        id SERIAL PRIMARY KEY,
        menu_items JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    pool.query(createTableQuery, (err) => {
      if (err) {
        console.error('Table creation error:', err);
        return res.status(500).json({ error: 'Tablo oluşturulamadı' });
      }

      // Menü öğelerini kaydet/güncelle
      const upsertQuery = `
        INSERT INTO app_settings (id, menu_items, updated_at) 
        VALUES (1, $1, CURRENT_TIMESTAMP)
        ON CONFLICT (id) 
        DO UPDATE SET 
          menu_items = EXCLUDED.menu_items,
          updated_at = CURRENT_TIMESTAMP
      `;

      pool.query(upsertQuery, [JSON.stringify(menuItems)], (err, result) => {
        if (err) {
          console.error('Menu save error:', err);
          res.status(500).json({ error: 'Menü kaydedilemedi' });
        } else {
          res.status(200).json({ 
            message: 'Menü ayarları başarıyla kaydedildi',
            menuItems: menuItems
          });
        }
      });
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
