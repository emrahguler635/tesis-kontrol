const express = require('express');

const app = express();

// Basit test endpoint'i
app.get('/api/simple-test', (req, res) => {
  res.json({ 
    message: 'Basit test başarılı!',
    timestamp: new Date().toISOString()
  });
});

module.exports = app; 