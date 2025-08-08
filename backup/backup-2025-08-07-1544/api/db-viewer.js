const mongoose = require('mongoose');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // MongoDB bağlantısı
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tesis-kontrol';
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      bufferCommands: false,
      maxPoolSize: 1,
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority'
    });

    // Tüm koleksiyonları kontrol et
    const collections = await mongoose.connection.db.listCollections().toArray();
    const dbData = {};

    for (const collection of collections) {
      const data = await mongoose.connection.db.collection(collection.name).find({}).toArray();
      dbData[collection.name] = data;
    }

    res.status(200).json({
      message: 'Veritabanı verileri',
      connectionState: mongoose.connection.readyState,
      collections: collections.map(c => c.name),
      data: dbData
    });

  } catch (error) {
    res.status(500).json({
      error: 'Veritabanı bağlantı hatası',
      message: error.message,
      connectionState: mongoose.connection.readyState
    });
  }
}; 