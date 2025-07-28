const express = require('express');
const mongoose = require('mongoose');

const app = express();

// MongoDB bağlantısı
const MONGODB_URI = process.env.MONGODB_URI;

console.log('MongoDB URI:', MONGODB_URI ? 'Mevcut' : 'Eksik');

// MongoDB bağlantı fonksiyonu
async function connectToMongoDB() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    console.log('MongoDB bağlantısı deneniyor...');
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      bufferCommands: false,
      maxPoolSize: 1,
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority',
      useNewUrlParser: true,
      useUnifiedTopology: true,
      family: 4,
      heartbeatFrequencyMS: 10000,
      serverApi: {
        version: '1',
        strict: false,
        deprecationErrors: false
      }
    });
    
    console.log('MongoDB veritabanına başarıyla bağlandı.');
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error.message);
  }
}

// İlk bağlantıyı başlat
connectToMongoDB();

// Test endpoint'i
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server çalışıyor!',
    mongodb_uri: MONGODB_URI ? 'Mevcut' : 'Eksik',
    connection_state: mongoose.connection.readyState,
    timestamp: new Date().toISOString()
  });
});

// Basit test endpoint'i
app.get('/api/simple-test', (req, res) => {
  res.json({ 
    message: 'Basit test başarılı!',
    timestamp: new Date().toISOString()
  });
});

// MongoDB bağlantı test endpoint'i
app.get('/api/mongo-test', async (req, res) => {
  try {
    console.log('MongoDB test endpoint çağrıldı');
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('MongoDB URI exists:', !!MONGODB_URI);
    
    const connectionState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    res.json({
      message: 'MongoDB bağlantı testi',
      hasMongoDBUri: !!MONGODB_URI,
      maskedUri: MONGODB_URI ? MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : null,
      connectionState: connectionState,
      connectionStateText: states[connectionState] || 'unknown',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Test hatası',
      message: error.message,
      connectionState: mongoose.connection.readyState
    });
  }
});

module.exports = app; 