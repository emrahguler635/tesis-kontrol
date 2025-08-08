const express = require('express');
const WhatsAppService = require('../backend/whatsapp-service.js');

const app = express();
app.use(express.json());

// WhatsApp servisini başlat
const whatsappService = new WhatsAppService();

// WhatsApp durumu
app.get('/api/whatsapp/status', async (req, res) => {
  try {
    const status = whatsappService.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('WhatsApp durumu alınamadı:', error);
    res.status(500).json({
      success: false,
      error: 'WhatsApp durumu alınamadı'
    });
  }
});

// QR kod oluştur
app.post('/api/whatsapp/qr', async (req, res) => {
  try {
    const qrCode = await whatsappService.generateQR();
    
    if (qrCode) {
      res.json({
        success: true,
        data: {
          qrCode: qrCode,
          message: 'WhatsApp QR kod oluşturuldu'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'QR kod oluşturulamadı'
      });
    }
  } catch (error) {
    console.error('QR kod oluşturulamadı:', error);
    res.status(500).json({
      success: false,
      error: 'QR kod oluşturulamadı'
    });
  }
});

// Bağlantıyı kes
app.post('/api/whatsapp/disconnect', async (req, res) => {
  try {
    await whatsappService.disconnect();
    res.json({
      success: true,
      data: {
        message: 'WhatsApp bağlantısı kesildi'
      }
    });
  } catch (error) {
    console.error('Bağlantı kesilemedi:', error);
    res.status(500).json({
      success: false,
      error: 'Bağlantı kesilemedi'
    });
  }
});

// Tek mesaj gönder
app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'Telefon numarası ve mesaj gerekli'
      });
    }

    const result = await whatsappService.sendMessage(phoneNumber, message);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Mesaj gönderilemedi:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Toplu mesaj gönder
app.post('/api/whatsapp/send-bulk', async (req, res) => {
  try {
    const { phoneNumbers, message } = req.body;
    
    if (!phoneNumbers || !message) {
      return res.status(400).json({
        success: false,
        error: 'Telefon numaraları ve mesaj gerekli'
      });
    }

    const result = await whatsappService.sendBulkMessage(phoneNumbers, message);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Toplu mesaj gönderilemedi:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = app; 