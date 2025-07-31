const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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
      serverSelectionTimeoutMS: 10000, // 10 saniye
      socketTimeoutMS: 45000, // 45 saniye
      connectTimeoutMS: 10000, // 10 saniye
      bufferCommands: false,
      maxPoolSize: 1,
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority',
  useNewUrlParser: true,
      useUnifiedTopology: true,
      family: 4, // IPv4 kullan
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
    console.error('Bağlantı URI:', MONGODB_URI ? 'Mevcut' : 'Eksik');
    
    // Hata detaylarını logla
    if (error.name === 'MongoServerSelectionError') {
      console.error('Sunucu seçim hatası - Network Access ayarlarını kontrol edin');
    } else if (error.name === 'MongoServerError' && error.code === 18) {
      console.error('Kimlik doğrulama hatası - Kullanıcı adı/şifre kontrol edin');
    }
  }
}

// İlk bağlantıyı başlat
connectToMongoDB();

// MongoDB bağlantı event handlers
mongoose.connection.on('connected', () => {
  console.log('MongoDB veritabanına bağlandı.');
  // Bağlantı başarılı olduğunda örnek verileri oluştur
  createSampleData();
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB bağlantı hatası:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB bağlantısı kesildi.');
});

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
    
    // Bağlantı durumunu kontrol et
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

// Debug endpoint - Tüm verileri listele
app.get('/api/debug-data', async (req, res) => {
  try {
    console.log('Debug data endpoint çağrıldı');
    
    // Tüm koleksiyonları kontrol et
    const collections = await mongoose.connection.db.listCollections().toArray();
    const dbData = {};
    
    for (const collection of collections) {
      const data = await mongoose.connection.db.collection(collection.name).find({}).toArray();
      dbData[collection.name] = data;
    }
    
    res.json({
      message: 'Debug verileri',
      connectionState: mongoose.connection.readyState,
      collections: collections.map(c => c.name),
      data: dbData
    });
  } catch (error) {
    console.error('Debug data error:', error);
    res.status(500).json({
      error: 'Debug data hatası',
      message: error.message,
      connectionState: mongoose.connection.readyState
    });
  }
});

// LocalStorage verilerini kontrol etmek için endpoint
app.get('/api/localstorage-data', (req, res) => {
  try {
    // Bu endpoint frontend'den localStorage verilerini alacak
    res.json({
      message: 'LocalStorage veri kontrolü',
      note: 'Bu endpoint frontend localStorage verilerini kontrol etmek için kullanılır'
    });
  } catch (error) {
    res.status(500).json({
      error: 'LocalStorage data hatası',
      message: error.message
    });
  }
});

// localStorage verilerini database'e aktarmak için endpoint
app.post('/api/import-localstorage', async (req, res) => {
  try {
    const { facilities, bagtvFacilities, controlItems, messages } = req.body;
    
    console.log('Importing localStorage data to database...');
    
    // Facilities import
    if (facilities && facilities.length > 0) {
      await Facility.insertMany(facilities);
      console.log(`Imported ${facilities.length} facilities`);
    }
    
    // BagTV Facilities import
    if (bagtvFacilities && bagtvFacilities.length > 0) {
      await BagTVFacility.insertMany(bagtvFacilities);
      console.log(`Imported ${bagtvFacilities.length} BagTV facilities`);
    }
    
    // Control Items import
    if (controlItems && controlItems.length > 0) {
      await ControlItem.insertMany(controlItems);
      console.log(`Imported ${controlItems.length} control items`);
    }
    
    // Messages import
    if (messages && messages.length > 0) {
      await Message.insertMany(messages);
      console.log(`Imported ${messages.length} messages`);
    }
    
    res.json({
      message: 'Veriler başarıyla database\'e aktarıldı',
      imported: {
        facilities: facilities?.length || 0,
        bagtvFacilities: bagtvFacilities?.length || 0,
        controlItems: controlItems?.length || 0,
        messages: messages?.length || 0
      }
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      error: 'Import hatası',
      message: error.message
    });
  }
});

// Tüm verileri export etmek için endpoint
app.get('/api/export-data', (req, res) => {
  try {
    res.json({
      message: 'Veri export endpoint',
      note: 'Bu endpoint tüm verileri JSON formatında export eder'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Export data hatası',
      message: error.message
    });
  }
});

// Login test endpoint'i
app.get('/api/login-test', (req, res) => {
  res.json({ 
    message: 'Login endpoint çalışıyor!',
    test_credentials: {
      username: 'admin',
      password: 'admin123'
    }
  });
});

// Basit login endpoint'i (MongoDB olmadan da çalışır)
app.post('/api/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }
    
    // Basit kontrol - MongoDB bağlantısı olmasa da çalışır
    if (username === 'admin' && password === 'admin123') {
      console.log('Login successful for user:', username);
      res.json({
        id: 'admin-id',
        username: 'admin',
        email: 'admin@admin.com',
        role: 'admin'
      });
    } else {
      console.log('Login failed: Invalid credentials');
      res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Control Items API
app.get('/api/control-items', async (req, res) => {
  try {
    const items = await ControlItem.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Control items alınamadı' });
  }
});

// Control Items POST (Create)
app.post('/api/control-items', async (req, res) => {
  try {
    const { title, description, period, date, facilityId, workDone, user, status } = req.body;
    const newItem = await ControlItem.create({
      title,
      description,
      period,
      date,
      facilityId,
      workDone,
      user,
      status,
      createdAt: new Date()
    });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Control item oluşturulamadı' });
  }
});

// Control Items PUT (Update)
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

    // facilityId'yi facility_id'ye dönüştür
    const facility_id = facilityId || 1;

    const updatedItem = await ControlItem.findByIdAndUpdate(
      id, 
      { 
        title, 
        description, 
        period, 
        date, 
        facilityId: facility_id, 
        workDone, 
        user: userName, 
        status,
        approvalStatus,
        updatedAt: new Date()
      }, 
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).json({ error: 'Control item bulunamadı.' });
    }
    console.log('Control item updated:', updatedItem);
    res.json(updatedItem);
  } catch (error) {
    console.error('Control item update error:', error);
    res.status(500).json({ error: 'Control item güncellenemedi', message: error.message });
  }
});

// Control Items DELETE
app.delete('/api/control-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItem = await ControlItem.findByIdAndDelete(id);
    if (!deletedItem) {
      return res.status(404).json({ error: 'Control item bulunamadı.' });
    }
    res.json({ message: 'Control item silindi', id });
  } catch (error) {
    res.status(500).json({ error: 'Control item silinemedi' });
  }
});

// Facilities API
app.get('/api/facilities', async (req, res) => {
  try {
  const facilities = await Facility.find();
  res.json(facilities);
  } catch (error) {
    res.status(500).json({ error: 'Facilities alınamadı' });
  }
});

// Facilities POST (Create)
app.post('/api/facilities', async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const newFacility = await Facility.create({
      name,
      description,
      status: status || 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    res.status(201).json(newFacility);
  } catch (error) {
    res.status(500).json({ error: 'Facility oluşturulamadı' });
  }
});

// Facilities PUT (Update)
app.put('/api/facilities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;
    const updatedFacility = await Facility.findByIdAndUpdate(
      id, 
      { name, description, status, updatedAt: new Date() }, 
      { new: true }
    );
    if (!updatedFacility) {
      return res.status(404).json({ error: 'Facility bulunamadı.' });
    }
    res.json(updatedFacility);
  } catch (error) {
    res.status(500).json({ error: 'Facility güncellenemedi' });
  }
});

// Facilities DELETE
app.delete('/api/facilities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedFacility = await Facility.findByIdAndDelete(id);
    if (!deletedFacility) {
      return res.status(404).json({ error: 'Facility bulunamadı.' });
    }
    res.json({ message: 'Facility silindi', id });
  } catch (error) {
    res.status(500).json({ error: 'Facility silinemedi' });
  }
});

// BagTV Facilities API
app.get('/api/bagtv-facilities', async (req, res) => {
  try {
    const facilities = await BagTVFacility.find();
    res.json(facilities);
  } catch (error) {
    res.status(500).json({ error: 'BagTV facilities alınamadı' });
  }
});

// BagTV Facilities POST (Create)
app.post('/api/bagtv-facilities', async (req, res) => {
  try {
    console.log('BagTV facility create request:', req.body);
    const { name, tvCount, description, status } = req.body;
    
    if (!name) {
      console.log('Error: name is required');
      return res.status(400).json({ error: 'Tesis adı gerekli' });
    }
    
    console.log('MongoDB connection state:', mongoose.connection.readyState);
    console.log('Creating BagTV facility with data:', { name, tvCount, description, status });
    
    const newFacility = await BagTVFacility.create({
      name,
      tvCount: Number(tvCount) || 0,
      description: description || '',
      status: status || 'Aktif',
      createdAt: new Date()
    });
    
    console.log('Successfully created new facility:', newFacility);
    res.status(201).json(newFacility);
  } catch (error) {
    console.error('BagTV facility create error details:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'BagTV facility oluşturulamadı: ' + error.message });
  }
});

// BagTV Facilities PUT (Update)
app.put('/api/bagtv-facilities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, tvCount, description, status } = req.body;
    const updatedFacility = await BagTVFacility.findByIdAndUpdate(
      id, 
      { name, tvCount: Number(tvCount), description, status }, 
      { new: true }
    );
    if (!updatedFacility) {
      return res.status(404).json({ error: 'BagTV facility bulunamadı.' });
    }
    res.json(updatedFacility);
  } catch (error) {
    res.status(500).json({ error: 'BagTV facility güncellenemedi' });
  }
});

// BagTV Facilities DELETE
app.delete('/api/bagtv-facilities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedFacility = await BagTVFacility.findByIdAndDelete(id);
    if (!deletedFacility) {
      return res.status(404).json({ error: 'BagTV facility bulunamadı.' });
    }
    res.json({ message: 'BagTV facility silindi', id });
  } catch (error) {
    res.status(500).json({ error: 'BagTV facility silinemedi' });
  }
});

// Messages API
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Messages alınamadı' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { date, totalCount, pulledCount, description, account } = req.body;
    const newMessage = await Message.create({ 
      date, 
      totalCount, 
      pulledCount, 
      description, 
      account,
      createdAt: new Date()
    });
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: 'Mesaj eklenirken hata oluştu.' });
  }
});

app.put('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, totalCount, pulledCount, description, account } = req.body;
    const updated = await Message.findByIdAndUpdate(
      id, 
      { date, totalCount, pulledCount, description, account }, 
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Mesaj bulunamadı.' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Mesaj güncellenirken hata oluştu.' });
  }
});

app.delete('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Message.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Mesaj bulunamadı.' });
    }
    res.json({ message: 'Mesaj silindi.' });
  } catch (err) {
    res.status(500).json({ error: 'Mesaj silinirken hata oluştu.' });
  }
});

// BağTV
const bagtvSchema = new mongoose.Schema({
  title: String,
  url: String
});
const BagTV = mongoose.model('BagTV', bagtvSchema);

// Facility Schema
const facilitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const Facility = mongoose.model('Facility', facilitySchema);

// ControlItem Schema
const controlItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  period: { type: String, required: true }, // daily, weekly, monthly, yearly
  date: { type: String, required: true },
  facilityId: { type: String, default: '' },
  workDone: { type: String, default: '' },
  user: { type: String, default: '' },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
const ControlItem = mongoose.model('ControlItem', controlItemSchema);

// Message Schema
const messageSchema = new mongoose.Schema({
  date: { type: String, required: true },
  totalCount: { type: Number, default: 0 },
  pulledCount: { type: Number, default: 0 },
  description: { type: String, default: '' },
  account: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);
async function createSampleBagTV() {
  const count = await BagTV.countDocuments();
  if (count === 0) {
    await BagTV.insertMany([
      { title: 'Tanıtım Videosu', url: 'https://www.youtube.com/watch?v=example' }
    ]);
  }
}
createSampleBagTV();
app.get('/api/bagtv', async (req, res) => {
  const videos = await BagTV.find();
  res.json(videos);
});

// BağTV'ye özel tesis koleksiyonu ve CRUD endpointleri
const bagTVFacilitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  tvCount: { type: Number, default: 0 },
  description: { type: String, default: '' },
  status: { type: String, default: 'Aktif' },
  createdAt: { type: Date, default: Date.now }
});
const BagTVFacility = mongoose.model('BagTVFacility', bagTVFacilitySchema, 'bagtvfacilities');

// Listele
app.get('/api/bagtv/facilities', async (req, res) => {
  try {
    const facilities = await BagTVFacility.find();
    res.json(facilities);
  } catch (err) {
    res.status(500).json({ error: 'BağTV tesisleri alınırken hata oluştu.' });
  }
});
// Ekle
app.post('/api/bagtv/facilities', async (req, res) => {
  try {
    const { name, tvCount, description, status } = req.body;
    const newFacility = await BagTVFacility.create({ name, tvCount, description, status });
    res.status(201).json(newFacility);
  } catch (err) {
    res.status(500).json({ error: 'BağTV tesisi eklenirken hata oluştu.' });
  }
});
// Güncelle
app.put('/api/bagtv/facilities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, tvCount, description, status } = req.body;
    const updated = await BagTVFacility.findByIdAndUpdate(id, { name, tvCount, description, status }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'BağTV tesisi güncellenirken hata oluştu.' });
  }
});
// Sil
app.delete('/api/bagtv/facilities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await BagTVFacility.findByIdAndDelete(id);
    res.json({ message: 'Tesis silindi.' });
  } catch (err) {
    res.status(500).json({ error: 'BağTV tesisi silinirken hata oluştu.' });
  }
});



// Listele (facilityId ile filtrelenebilir)
app.get('/api/bagtv/controls', async (req, res) => {
  try {
    const { facilityId } = req.query;
    const query = facilityId ? { facilityId } : {};
    const controls = await BagTVControl.find(query).sort({ date: -1 });
    res.json(controls);
  } catch (err) {
    res.status(500).json({ error: 'BağTV kontrol kayıtları alınırken hata oluştu.' });
  }
});
// Ekle
app.post('/api/bagtv/controls', async (req, res) => {
  try {
    const { facilityId, date, action, description, checkedBy } = req.body;
    const newControl = await BagTVControl.create({
      facilityId,
      date,
      action,
      description,
      checkedBy,
      createdAt: new Date()
    });
    res.status(201).json(newControl);
  } catch (err) {
    res.status(500).json({ error: 'BağTV kontrol kaydı eklenirken hata oluştu.' });
  }
});
// Sil
app.delete('/api/bagtv/controls/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await BagTVControl.findByIdAndDelete(id);
    res.json({ message: 'Kontrol kaydı silindi.' });
  } catch (err) {
    res.status(500).json({ error: 'BağTV kontrol kaydı silinirken hata oluştu.' });
  }
});

// Ayarlar (örnek statik veri)
app.get('/api/settings', (req, res) => {
  res.json({
    theme: 'light',
    notifications: true,
    language: 'tr'
  });
});

// Varsayılan admin kullanıcısı oluştur
async function createDefaultAdmin() {
  try {
    console.log('Checking for existing admin users...');
    
    // MongoDB bağlantısının hazır olmasını bekle
    if (mongoose.connection.readyState !== 1) {
      console.log('Waiting for MongoDB connection...');
      await new Promise(resolve => {
        mongoose.connection.once('connected', resolve);
        setTimeout(resolve, 5000); // 5 saniye timeout
      });
    }
    
    const adminCount = await User.countDocuments().maxTimeMS(5000);
    console.log('Current user count:', adminCount);
    
    if (adminCount === 0) {
      console.log('Creating default admin user...');
      await User.create({
        username: 'admin',
        email: 'admin@admin.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('Varsayılan admin kullanıcısı oluşturuldu.');
    } else {
      console.log('Admin user already exists, skipping creation.');
    }
  } catch (error) {
    console.error('Admin oluşturma hatası:', error);
  }
}

// Örnek veriler oluştur
async function createSampleData() {
  try {
    console.log('Creating sample data...');
    
    // Örnek tesisler
    const facilityCount = await Facility.countDocuments().maxTimeMS(5000);
    if (facilityCount === 0) {
      console.log('Creating sample facilities...');
      await Facility.insertMany([
        {
          name: 'Merkez Ofis',
          description: 'Ana merkez ofis binası',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Şube Ofis',
          description: 'Şube ofis binası',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
      console.log('Sample facilities created.');
    }
    
    // Örnek BagTV tesisleri
    const bagtvCount = await BagTVFacility.countDocuments().maxTimeMS(5000);
    if (bagtvCount === 0) {
      console.log('Creating sample BagTV facilities...');
      await BagTVFacility.insertMany([
        {
          name: 'Konferans Salonu',
          tvCount: 3,
          description: 'Ana konferans salonu',
          status: 'Aktif',
          createdAt: new Date()
        },
        {
          name: 'Toplantı Odası',
          tvCount: 1,
          description: 'Küçük toplantı odası',
          status: 'Aktif',
          createdAt: new Date()
        }
      ]);
      console.log('Sample BagTV facilities created.');
    }
    
    // Örnek kontrol öğeleri
    const controlCount = await ControlItem.countDocuments().maxTimeMS(5000);
    if (controlCount === 0) {
      console.log('Creating sample control items...');
      await ControlItem.insertMany([
        {
          title: 'Günlük Kontrol',
          description: 'Günlük sistem kontrolü',
          period: 'daily',
          date: new Date().toISOString().split('T')[0],
          facilityId: '',
          workDone: '',
          user: 'admin',
          status: 'pending',
          createdAt: new Date()
        }
      ]);
      console.log('Sample control items created.');
    }
    
    // Örnek mesajlar
    const messageCount = await Message.countDocuments().maxTimeMS(5000);
    if (messageCount === 0) {
      console.log('Creating sample messages...');
      await Message.insertMany([
        {
          date: new Date().toISOString().split('T')[0],
          totalCount: 100,
          pulledCount: 85,
          description: 'Günlük mesaj raporu',
          account: 'admin',
          createdAt: new Date()
        }
      ]);
      console.log('Sample messages created.');
    }
    
    console.log('Sample data creation completed.');
  } catch (error) {
    console.error('Sample data creation error:', error);
  }
}

// Sunucu başlarken admin ve örnek veriler oluştur
createDefaultAdmin();
createSampleData();

// Tüm kullanıcıları listele (sadece admin)
app.get('/api/users', async (req, res) => {
  try {
    const { role } = req.query;
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Yetkisiz' });
    }
    
    const users = await User.find({}, { password: 0 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcılar alınamadı' });
  }
});

// Kullanıcı rolünü güncelle (sadece admin)
app.put('/api/users/:id/role', async (req, res) => {
  try {
    const { role: adminRole } = req.query;
    if (adminRole !== 'admin') {
      return res.status(403).json({ error: 'Yetkisiz' });
    }
    
    const { id } = req.params;
    const { role } = req.body;
    
    const user = await User.findByIdAndUpdate(
      id, 
      { role }, 
      { new: true, select: '-password' }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Rol güncellenemedi' });
  }
});

// Yeni kullanıcı oluştur (sadece admin)
app.post('/api/users', async (req, res) => {
  try {
    const { role: adminRole } = req.query;
    if (adminRole !== 'admin') {
      return res.status(403).json({ error: 'Yetkisiz' });
    }
    
    const { username, email, password, role } = req.body;
    const user = await User.create({
      username,
      email,
      password,
      role: role || 'user'
    });
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Kullanıcı adı veya email zaten kullanımda' });
    } else {
      res.status(500).json({ error: 'Kullanıcı oluşturulamadı' });
    }
  }
});

// Kullanıcı sil (sadece admin)
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { role: adminRole } = req.query;
    if (adminRole !== 'admin') {
      return res.status(403).json({ error: 'Yetkisiz' });
    }
    
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    res.json({ message: 'Kullanıcı silindi' });
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcı silinemedi' });
  }
});

// Geçici admin ekleme endpointi
app.post('/api/create-admin', async (req, res) => {
  try {
    const existing = await User.findOne({ username: 'admin' });
    if (existing) {
      return res.status(400).json({ message: 'Admin zaten var.' });
    }
    await User.create({
      username: 'admin',
      email: 'admin@admin.com',
      password: 'admin123',
      role: 'admin'
    });
    res.json({ message: 'Admin başarıyla eklendi.' });
  } catch (error) {
    res.status(500).json({ error: 'Admin eklenemedi.' });
  }
});

// Tüm kullanıcıları listele (geçici, güvenlik için sonra silinecek)
app.get('/api/all-users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// ControlItems genel endpointi (period ve facilityId ile filtreleme)
app.get('/api/control-items', async (req, res) => {
  try {
    const { period, facilityId } = req.query;
    const query = {};
    if (period) query.period = period;
    if (facilityId) query.facilityId = facilityId;
    const items = await ControlItem.find(query);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Kontrol itemları alınırken hata oluştu.' });
  }
});

// ControlItem ekleme
app.post('/api/control-items', async (req, res) => {
  try {
    const { title, description, period, date, facilityId, workDone, user, status } = req.body;
    const newItem = await ControlItem.create({ 
      title, 
      description, 
      period, 
      date, 
      facilityId, 
      workDone, 
      user, 
      status,
      createdAt: new Date()
    });
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: 'Kontrol itemı eklenirken hata oluştu.' });
  }
});

// ControlItem güncelleme
app.put('/api/control-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, period, date, facilityId, workDone, user, status } = req.body;
    const updated = await ControlItem.findByIdAndUpdate(
      id, 
      { title, description, period, date, facilityId, workDone, user, status }, 
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Kontrol itemı bulunamadı.' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Kontrol itemı güncellenirken hata oluştu.' });
  }
});

// ControlItem silme
app.delete('/api/control-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ControlItem.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Kontrol itemı bulunamadı.' });
    }
    res.json({ message: 'Kontrol itemı silindi.' });
  } catch (err) {
    res.status(500).json({ error: 'Kontrol itemı silinirken hata oluştu.' });
  }
});

// ControlItem taşıma (bir periyottan diğerine)
app.post('/api/control-items/move', async (req, res) => {
  try {
    const { sourcePeriod, targetPeriod, startDate, endDate } = req.body;
    
    // Kaynak periyottaki işleri getir
    const sourceItems = await ControlItem.find({ period: sourcePeriod });
    
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
      item.status === 'Tamamlandı' || item.status === 'Yapılmadı'
    );

    if (filteredItems.length === 0) {
      return res.status(404).json({ error: 'Seçilen tarih aralığında taşınacak iş bulunamadı.' });
    }

    // Hedef periyottaki mevcut işleri kontrol et
    const targetItems = await ControlItem.find({ period: targetPeriod });
    
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
    const movePromises = itemsToMove.map(async (item) => {
      try {
        // Yeni iş oluştur
        const newItem = await ControlItem.create({
          title: item.title,
          description: item.description,
          period: targetPeriod,
          date: new Date().toISOString().split('T')[0], // Bugünün tarihi
          facilityId: item.facilityId,
          workDone: item.workDone,
          user: item.user,
          status: item.status,
          createdAt: new Date()
        });

        // Eski işi sil
        await ControlItem.findByIdAndDelete(item._id);

        return newItem;
      } catch (error) {
        console.error('Taşıma sırasında hata:', error);
        throw error;
      }
    });

    const movedItems = await Promise.all(movePromises);

    res.json({ 
      message: `${movedItems.length} adet iş ${sourcePeriod} periyotundan ${targetPeriod} periyotuna taşındı.`,
      movedCount: movedItems.length
    });

  } catch (err) {
    console.error('Taşıma hatası:', err);
    console.error('Hata detayları:', {
      message: err.message,
      stack: err.stack,
      sourcePeriod,
      targetPeriod,
      startDate,
      endDate
    });
    res.status(500).json({ 
      error: 'İşler taşınırken hata oluştu.',
      details: err.message 
    });
  }
});

// BagTV Controls API
app.get('/api/bagtv-controls', async (req, res) => {
  try {
    const { facilityId } = req.query;
    let query = {};
    if (facilityId) {
      query = { facilityId };
    }
    const controls = await BagTVControl.find(query);
    res.json(controls);
  } catch (error) {
    res.status(500).json({ error: 'BagTV controls alınamadı' });
  }
});

// BagTV Controls POST (Create)
app.post('/api/bagtv-controls', async (req, res) => {
  try {
    const { facilityId, date, action, description, checkedBy } = req.body;
    const newControl = await BagTVControl.create({
      facilityId,
      date,
      action,
      description,
      checkedBy,
      createdAt: new Date()
    });
    res.status(201).json(newControl);
  } catch (error) {
    res.status(500).json({ error: 'BagTV control oluşturulamadı' });
  }
});

// BagTV Controls DELETE
app.delete('/api/bagtv-controls/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedControl = await BagTVControl.findByIdAndDelete(id);
    if (!deletedControl) {
      return res.status(404).json({ error: 'BagTV control bulunamadı.' });
    }
    res.json({ message: 'BagTV control silindi', id });
  } catch (error) {
    res.status(500).json({ error: 'BagTV control silinemedi' });
  }
});

// Test endpoint for debugging
app.get('/api/test-bagtv', async (req, res) => {
  try {
    console.log('Testing BagTV functionality...');
    console.log('MongoDB connection state:', mongoose.connection.readyState);
    
    // Test if BagTVFacility model exists
    const facilityCount = await BagTVFacility.countDocuments();
    console.log('Current BagTV facility count:', facilityCount);
    
    // Test creating a simple facility
    const testFacility = await BagTVFacility.create({
      name: 'Test Facility',
      tvCount: 1,
      description: 'Test description',
      status: 'Aktif',
      createdAt: new Date()
    });
    console.log('Test facility created:', testFacility);
    
    // Clean up - delete test facility
    await BagTVFacility.findByIdAndDelete(testFacility._id);
    console.log('Test facility deleted');
    
    res.json({ 
      message: 'BagTV test successful',
      connectionState: mongoose.connection.readyState,
      facilityCount: facilityCount
    });
  } catch (error) {
    console.error('BagTV test error:', error);
    res.status(500).json({ 
      error: 'BagTV test failed: ' + error.message,
      connectionState: mongoose.connection.readyState
    });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB bağlantısı kapatıldı.');
    process.exit(0);
  } catch (error) {
    console.error('MongoDB kapatma hatası:', error);
    process.exit(1);
  }
}); 

// Sunucuyu başlat
const server = app.listen(PORT, () => {
  console.log(`MongoDB sunucusu http://localhost:${PORT} adresinde çalışıyor`);
});

// Vercel serverless function export
module.exports = app; 