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