const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB bağlantısı
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tesis-kontrol';

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  bufferCommands: false,
  bufferMaxEntries: 0,
  maxPoolSize: 1,
  minPoolSize: 0,
  maxIdleTimeMS: 30000,
  retryWrites: true,
  w: 'majority'
});

// Schemas
const bagTVFacilitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  tvCount: { type: Number, default: 0 },
  description: String,
  status: { type: String, default: 'Aktif' },
  createdAt: { type: Date, default: Date.now }
});

const bagTVControlSchema = new mongoose.Schema({
  facilityId: { type: String, required: true },
  date: { type: String, required: true },
  action: { type: String, required: true },
  description: String,
  checkedBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const facilitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const controlItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  period: { type: String, required: true },
  date: { type: String, required: true },
  facilityId: String,
  workDone: String,
  user: String,
  status: String,
  approvalStatus: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
  approvedBy: String,
  approvedAt: Date,
  rejectionReason: String,
  createdAt: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
  date: { type: String, required: true },
  totalCount: { type: Number, required: true },
  pulledCount: { type: Number, required: true },
  description: { type: String, required: true },
  account: String,
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  createdAt: { type: Date, default: Date.now }
});

// Models
const BagTVFacility = mongoose.model('BagTVFacility', bagTVFacilitySchema);
const BagTVControl = mongoose.model('BagTVControl', bagTVControlSchema);
const Facility = mongoose.model('Facility', facilitySchema);
const ControlItem = mongoose.model('ControlItem', controlItemSchema);
const Message = mongoose.model('Message', messageSchema);
const User = mongoose.model('User', userSchema);

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server çalışıyor!',
    timestamp: new Date().toISOString()
  });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }
    
    // Basit kontrol
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

// BagTV Facilities endpoints
app.get('/api/bagtv-facilities', async (req, res) => {
  try {
    console.log('Getting BagTV facilities...');
    const facilities = await BagTVFacility.find();
    console.log('Found facilities:', facilities.length);
    res.json(facilities);
  } catch (error) {
    console.error('Error getting BagTV facilities:', error);
    res.status(500).json({ error: 'BagTV facilities alınamadı' });
  }
});

app.post('/api/bagtv-facilities', async (req, res) => {
  try {
    console.log('Creating BagTV facility:', req.body);
    const { name, tvCount, description, status } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Tesis adı gerekli' });
    }
    
    const newFacility = await BagTVFacility.create({
      name,
      tvCount: Number(tvCount) || 0,
      description: description || '',
      status: status || 'Aktif',
      createdAt: new Date()
    });
    
    console.log('Created facility:', newFacility);
    res.status(201).json(newFacility);
  } catch (error) {
    console.error('Error creating BagTV facility:', error);
    res.status(500).json({ error: 'BagTV facility oluşturulamadı: ' + error.message });
  }
});

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

// BagTV Controls endpoints
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

// Facilities endpoints
app.get('/api/facilities', async (req, res) => {
  try {
    const facilities = await Facility.find();
    res.json(facilities);
  } catch (error) {
    res.status(500).json({ error: 'Facilities alınamadı' });
  }
});

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

// Control Items endpoints
app.get('/api/control-items', async (req, res) => {
  try {
    const items = await ControlItem.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Control items alınamadı' });
  }
});

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

// Messages endpoints
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Messages alınamadı' });
  }
});

// Users endpoints
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Şifreleri hariç tut
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Users alınamadı' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const newUser = await User.create({
      username,
      email,
      password, // Gerçek uygulamada şifre hash'lenmeli
      role: role || 'user',
      createdAt: new Date()
    });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'User oluşturulamadı' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, role } = req.body;
    const updateData = { username, email, role };
    if (password) {
      updateData.password = password; // Gerçek uygulamada şifre hash'lenmeli
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ error: 'User bulunamadı.' });
    }
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'User güncellenemedi' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User bulunamadı.' });
    }
    res.json({ message: 'User silindi', id });
  } catch (error) {
    res.status(500).json({ error: 'User silinemedi' });
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
  } catch (error) {
    res.status(500).json({ error: 'Message oluşturulamadı' });
  }
});

app.put('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, totalCount, pulledCount, description, account } = req.body;
    const updatedMessage = await Message.findByIdAndUpdate(
      id, 
      { date, totalCount, pulledCount, description, account }, 
      { new: true }
    );
    if (!updatedMessage) {
      return res.status(404).json({ error: 'Message bulunamadı.' });
    }
    res.json(updatedMessage);
  } catch (error) {
    res.status(500).json({ error: 'Message güncellenemedi' });
  }
});

app.delete('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedMessage = await Message.findByIdAndDelete(id);
    if (!deletedMessage) {
      return res.status(404).json({ error: 'Message bulunamadı.' });
    }
    res.json({ message: 'Message silindi', id });
  } catch (error) {
    res.status(500).json({ error: 'Message silinemedi' });
  }
});

// Onay bekleyen işler endpoint'i
app.get('/api/control-items/pending-approvals', async (req, res) => {
  try {
    const { user } = req.query;
    console.log('Pending approvals request for user:', user);
    
    let query = { approvalStatus: 'pending' };
    
    // Eğer kullanıcı belirtilmişse ve admin değilse, sadece o kullanıcının işlerini getir
    if (user && user !== 'admin') {
      query.user = user;
    }
    
    const items = await ControlItem.find(query).sort({ date: -1 });
    console.log('Found pending items:', items.length);
    res.json(items);
  } catch (error) {
    console.error('Onay bekleyen işler alınamadı:', error);
    res.status(500).json({ error: 'Onay bekleyen işler alınamadı', message: error.message });
  }
});

// İş onaylama endpoint'i
app.post('/api/control-items/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    // Admin kontrolü - mock API'de basit kontrol
    if (approvedBy !== 'admin') {
      return res.status(403).json({ error: 'Sadece admin kullanıcıları onay işlemi yapabilir' });
    }

    const updatedItem = await ControlItem.findByIdAndUpdate(
      id,
      { 
        approvalStatus: 'approved', 
        approvedBy: approvedBy, 
        approvedAt: new Date() 
      },
      { new: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({ error: 'İş bulunamadı' });
    }

    res.json({ message: 'İş başarıyla onaylandı' });
  } catch (error) {
    console.error('İş onaylama hatası:', error);
    res.status(500).json({ error: 'İş onaylanamadı', message: error.message });
  }
});

// İş reddetme endpoint'i
app.post('/api/control-items/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectedBy, reason } = req.body;

    // Admin kontrolü - mock API'de basit kontrol
    if (rejectedBy !== 'admin') {
      return res.status(403).json({ error: 'Sadece admin kullanıcıları reddetme işlemi yapabilir' });
    }

    const updatedItem = await ControlItem.findByIdAndUpdate(
      id,
      { 
        approvalStatus: 'rejected', 
        approvedBy: rejectedBy, 
        approvedAt: new Date(),
        rejectionReason: reason 
      },
      { new: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({ error: 'İş bulunamadı' });
    }

    res.json({ message: 'İş başarıyla reddedildi' });
  } catch (error) {
    console.error('İş reddetme hatası:', error);
    res.status(500).json({ error: 'İş reddedilemedi', message: error.message });
  }
});

module.exports = app; 