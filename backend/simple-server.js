const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// CORS ayarları
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server çalışıyor!',
    timestamp: new Date().toISOString()
  });
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('Login attempt:', { username, password });
  
  if (username === 'admin' && password === 'admin123') {
    res.json({ 
      success: true, 
      user: { username: 'admin', role: 'admin' },
      message: 'Giriş başarılı' 
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Kullanıcı adı veya şifre hatalı' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} adresinde çalışıyor`);
}); 