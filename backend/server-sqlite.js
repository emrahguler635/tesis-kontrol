const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// SQLite database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Database initialization
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Facilities table
  db.run(`CREATE TABLE IF NOT EXISTS facilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // BagTV Facilities table
  db.run(`CREATE TABLE IF NOT EXISTS bagtv_facilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    tvCount INTEGER DEFAULT 0,
    description TEXT,
    status TEXT DEFAULT 'Aktif',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Control Items table
  db.run(`CREATE TABLE IF NOT EXISTS control_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    period TEXT NOT NULL,
    date TEXT NOT NULL,
    facilityId TEXT,
    workDone TEXT,
    user TEXT,
    status TEXT DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Messages table
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    totalCount INTEGER DEFAULT 0,
    pulledCount INTEGER DEFAULT 0,
    description TEXT,
    account TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create default admin user
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (err) {
      console.error('Error checking users:', err);
      return;
    }
    
    if (row.count === 0) {
      db.run(`INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`,
        ['admin', 'admin@admin.com', 'admin123', 'admin'],
        (err) => {
          if (err) {
            console.error('Error creating admin user:', err);
          } else {
            console.log('Default admin user created');
          }
        }
      );
    }
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'SQLite Server çalışıyor!',
    database: 'SQLite',
    timestamp: new Date().toISOString()
  });
});

// Test verisi ekleme endpoint'i
app.post('/api/add-test-data', (req, res) => {
  try {
    // Test tesisleri ekle
    const facilities = [
      { name: 'Test Tesis 1', description: 'Test açıklama 1', status: 'Aktif' },
      { name: 'Test Tesis 2', description: 'Test açıklama 2', status: 'Aktif' },
      { name: 'Test Tesis 3', description: 'Test açıklama 3', status: 'Pasif' }
    ];
    
    facilities.forEach(facility => {
      db.run(
        'INSERT OR IGNORE INTO facilities (name, description, status) VALUES (?, ?, ?)',
        [facility.name, facility.description, facility.status]
      );
    });
    
    // Test kullanıcıları ekle
    const users = [
      { username: 'admin', email: 'admin@admin.com', password: 'admin123', role: 'admin' },
      { username: 'user1', email: 'user1@test.com', password: 'password123', role: 'user' },
      { username: 'user2', email: 'user2@test.com', password: 'password123', role: 'user' }
    ];
    
    users.forEach(user => {
      db.run(
        'INSERT OR IGNORE INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [user.username, user.email, user.password, user.role]
      );
    });
    
    // Test kontrol işleri ekle
    const controlItems = [
      { title: 'Günlük Test İş 1', description: 'Günlük test açıklama', period: 'Günlük', date: '2025-07-30', facilityId: '1', workDone: 'Test iş yapıldı', user: 'admin', status: 'Tamamlandı' },
      { title: 'Haftalık Test İş 1', description: 'Haftalık test açıklama', period: 'Haftalık', date: '2025-07-30', facilityId: '2', workDone: 'Test iş yapıldı', user: 'user1', status: 'İşlemde' },
      { title: 'Aylık Test İş 1', description: 'Aylık test açıklama', period: 'Aylık', date: '2025-07-30', facilityId: '1', workDone: 'Test iş yapıldı', user: 'user2', status: 'Beklemede' }
    ];
    
    controlItems.forEach(item => {
      db.run(
        'INSERT OR IGNORE INTO control_items (title, description, period, date, facilityId, workDone, user, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [item.title, item.description, item.period, item.date, item.facilityId, item.workDone, item.user, item.status]
      );
    });
    
    // Test mesajları ekle
    const messages = [
      { date: '2025-07-30', totalCount: 100, pulledCount: 85, account: 'Yasin Yıldız', description: 'Test mesaj açıklama 1' },
      { date: '2025-07-29', totalCount: 150, pulledCount: 120, account: 'Abdullah Özdemir', description: 'Test mesaj açıklama 2' },
      { date: '2025-07-28', totalCount: 80, pulledCount: 75, account: 'Bağcılar Belediyesi', description: 'Test mesaj açıklama 3' }
    ];
    
    messages.forEach(message => {
      db.run(
        'INSERT OR IGNORE INTO messages (date, totalCount, pulledCount, account, description) VALUES (?, ?, ?, ?, ?)',
        [message.date, message.totalCount, message.pulledCount, message.account, message.description]
      );
    });
    
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

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username ve password gerekli' });
  }
  
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", 
    [username, password], 
    (err, user) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Login hatası' });
      }
      
      if (user) {
        res.json({
          message: 'Login başarılı',
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        });
      } else {
        res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
      }
    }
  );
});

// Facilities endpoints
app.get('/api/facilities', (req, res) => {
  db.all("SELECT * FROM facilities ORDER BY createdAt DESC", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Facilities alınamadı' });
    }
    res.json(rows);
  });
});

app.post('/api/facilities', (req, res) => {
  const { name, description, status } = req.body;
  
  db.run(`INSERT INTO facilities (name, description, status) VALUES (?, ?, ?)`,
    [name, description, status || 'active'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Facility oluşturulamadı' });
      }
      
      db.get("SELECT * FROM facilities WHERE id = ?", [this.lastID], (err, row) => {
        res.status(201).json(row);
      });
    }
  );
});

// BagTV Facilities endpoints
app.get('/api/bagtv-facilities', (req, res) => {
  db.all("SELECT * FROM bagtv_facilities ORDER BY createdAt DESC", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'BagTV facilities alınamadı' });
    }
    res.json(rows);
  });
});

app.post('/api/bagtv-facilities', (req, res) => {
  const { name, tvCount, description, status } = req.body;
  
  db.run(`INSERT INTO bagtv_facilities (name, tvCount, description, status) VALUES (?, ?, ?, ?)`,
    [name, tvCount || 0, description, status || 'Aktif'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'BagTV facility oluşturulamadı' });
      }
      
      db.get("SELECT * FROM bagtv_facilities WHERE id = ?", [this.lastID], (err, row) => {
        res.status(201).json(row);
      });
    }
  );
});

// Control Items endpoints
app.get('/api/control-items', (req, res) => {
  db.all("SELECT * FROM control_items ORDER BY createdAt DESC", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Control items alınamadı' });
    }
    res.json(rows);
  });
});

app.post('/api/control-items', (req, res) => {
  const { title, description, period, date, facilityId, workDone, user, status } = req.body;
  
  db.run(`INSERT INTO control_items (title, description, period, date, facilityId, workDone, user, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description, period, date, facilityId, workDone, user, status || 'pending'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Control item oluşturulamadı' });
      }
      
      db.get("SELECT * FROM control_items WHERE id = ?", [this.lastID], (err, row) => {
        res.status(201).json(row);
      });
    }
  );
});

// Control item güncelle
app.put('/api/control-items/:id', (req, res) => {
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

  // facilityId'yi facilityId olarak kullan (SQLite'da aynı isim)
  const facility_id = facilityId || 1;

  db.run(`UPDATE control_items SET title = ?, description = ?, period = ?, date = ?, facilityId = ?, workDone = ?, user = ?, status = ? WHERE id = ?`,
    [title, description, period, date, facility_id, workDone, userName, status, id],
    function(err) {
      if (err) {
        console.error('Control item update error:', err);
        return res.status(500).json({ error: 'Control item güncellenemedi', message: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Control item bulunamadı' });
      }
      
      // Güncellenmiş kaydı getir
      db.get("SELECT * FROM control_items WHERE id = ?", [id], (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Güncellenmiş kayıt alınamadı' });
        }
        console.log('Control item updated:', row);
        res.json(row);
      });
    }
  );
});

// Onay bekleyen işleri getir
app.get('/api/control-items/pending-approvals', (req, res) => {
  db.all("SELECT * FROM control_items WHERE status = 'pending' ORDER BY createdAt DESC", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Onay bekleyen işler alınamadı' });
    }
    res.json(rows);
  });
});

// İşi onayla
app.post('/api/control-items/:id/approve', (req, res) => {
  const { id } = req.params;
  const { approvedBy } = req.body;
  
  // Admin kontrolü
  db.get("SELECT role FROM users WHERE username = ?", [approvedBy], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Kullanıcı kontrolü yapılamadı' });
    }
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Sadece admin kullanıcıları onay işlemi yapabilir' });
    }
    
    db.run(`UPDATE control_items SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [approvedBy, id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'İş onaylanamadı' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'İş bulunamadı' });
        }
        
        res.json({ message: 'İş başarıyla onaylandı' });
      }
    );
  });
});

// İşi reddet
app.post('/api/control-items/:id/reject', (req, res) => {
  const { id } = req.params;
  const { rejectedBy, reason } = req.body;
  
  // Admin kontrolü
  db.get("SELECT role FROM users WHERE username = ?", [rejectedBy], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Kullanıcı kontrolü yapılamadı' });
    }
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Sadece admin kullanıcıları reddetme işlemi yapabilir' });
    }
    
    db.run(`UPDATE control_items SET status = 'rejected', approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [rejectedBy, id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'İş reddedilemedi' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'İş bulunamadı' });
        }
        
        res.json({ message: 'İş başarıyla reddedildi', reason });
      }
    );
  });
});

// Messages endpoints
app.get('/api/messages', (req, res) => {
  db.all("SELECT * FROM messages ORDER BY createdAt DESC", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Messages alınamadı' });
    }
    res.json(rows);
  });
});

app.post('/api/messages', (req, res) => {
  const { date, totalCount, pulledCount, description, account } = req.body;
  
  db.run(`INSERT INTO messages (date, totalCount, pulledCount, description, account) VALUES (?, ?, ?, ?, ?)`,
    [date, totalCount || 0, pulledCount || 0, description, account],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Message oluşturulamadı' });
      }
      
      db.get("SELECT * FROM messages WHERE id = ?", [this.lastID], (err, row) => {
        res.status(201).json(row);
      });
    }
  );
});

// ControlItem taşıma (bir periyottan diğerine)
app.post('/api/control-items/move', async (req, res) => {
  try {
    const { sourcePeriod, targetPeriod, startDate, endDate } = req.body;
    
    // Kaynak periyottaki işleri getir
    db.all("SELECT * FROM control_items WHERE period = ?", [sourcePeriod], (err, sourceItems) => {
      if (err) {
        console.error('Kaynak işler alınamadı:', err);
        return res.status(500).json({ error: 'Kaynak işler alınamadı' });
      }
      
      if (sourceItems.length === 0) {
        return res.status(404).json({ error: `${sourcePeriod} periyotunda taşınacak iş bulunamadı.` });
      }

      // Tarih aralığındaki işleri filtrele
      let filteredItems = sourceItems;
      if (startDate && endDate) {
        filteredItems = sourceItems.filter((item) => {
          const itemDate = new Date(item.date);
          const start = new Date(startDate);
          const end = new Date(endDate);
          return itemDate >= start && itemDate <= end;
        });
      }

      // SADECE Tamamlandı ve Yapılmadı olanlar
      filteredItems = filteredItems.filter(item =>
        item.status === 'Tamamlandı' || item.status === 'Tamamlandi' || item.status === 'Yapılmadı'
      );

      if (filteredItems.length === 0) {
        return res.status(404).json({ error: 'Seçilen tarih aralığında taşınacak iş bulunamadı.' });
      }

      // Hedef periyottaki mevcut işleri kontrol et
      db.all("SELECT * FROM control_items WHERE period = ?", [targetPeriod], (err, targetItems) => {
        if (err) {
          console.error('Hedef işler alınamadı:', err);
          return res.status(500).json({ error: 'Hedef işler alınamadı' });
        }
        
        // Sadece hedefte olmayan işleri taşı
        const itemsToMove = filteredItems.filter((item) => {
          return !targetItems.some((t) =>
            t.title === item.title &&
            t.description === item.description &&
            t.facilityId === item.facilityId
          );
        });

        if (itemsToMove.length === 0) {
          return res.status(400).json({ error: 'Seçilen tarih aralığındaki tüm işler zaten hedef periyotta mevcut.' });
        }

        // İşlemleri başlat
        let movedCount = 0;
        let completed = 0;

        itemsToMove.forEach((item) => {
          // Yeni iş oluştur
          db.run(`INSERT INTO control_items (title, description, period, date, facilityId, workDone, user, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [item.title, item.description, targetPeriod, new Date().toISOString().split('T')[0], item.facilityId, item.workDone, item.user, item.status],
            function(err) {
              if (err) {
                console.error('Yeni iş oluşturulamadı:', err);
                return;
              }

              // Eski işi sil
              db.run("DELETE FROM control_items WHERE id = ?", [item.id], (err) => {
                if (err) {
                  console.error('Eski iş silinemedi:', err);
                }
                
                movedCount++;
                completed++;
                
                if (completed === itemsToMove.length) {
                  res.json({ 
                    message: `${movedCount} adet iş ${sourcePeriod} periyotundan ${targetPeriod} periyotuna taşındı.`,
                    movedCount: movedCount
                  });
                }
              });
            }
          );
        });
      });
    });

  } catch (err) {
    console.error('Taşıma hatası:', err);
    console.error('Hata detayları:', {
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({ 
      error: 'İşler taşınırken hata oluştu.',
      details: err.message 
    });
  }
});

// Debug endpoint
app.get('/api/debug-data', (req, res) => {
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      return res.status(500).json({ error: 'Debug data alınamadı' });
    }
    
    const data = {};
    let completed = 0;
    
    tables.forEach(table => {
      db.all(`SELECT * FROM ${table.name}`, (err, rows) => {
        data[table.name] = rows;
        completed++;
        
        if (completed === tables.length) {
          res.json({
            message: 'Debug verileri',
            tables: tables.map(t => t.name),
            data: data
          });
        }
      });
    });
  });
});

// Database tablolarını listele
app.get('/api/database-tables', (req, res) => {
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      return res.status(500).json({ error: 'Tablolar alınamadı' });
    }
    
    res.json({
      message: 'Database tabloları',
      tables: tables.map(t => t.name),
      count: tables.length
    });
  });
});

// Belirli bir tablonun içeriğini görüntüle
app.get('/api/table/:tableName', (req, res) => {
  const { tableName } = req.params;
  
  db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: `Tablo verileri alınamadı: ${err.message}` });
    }
    
    res.json({
      message: `${tableName} tablosu`,
      table: tableName,
      count: rows.length,
      data: rows
    });
  });
});

app.listen(PORT, () => {
  console.log(`SQLite sunucusu http://localhost:${PORT} adresinde çalışıyor`);
}); 