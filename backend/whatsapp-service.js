const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.phoneNumber = null;
    this.lastSeen = null;
    this.qrCode = null;
  }

  // WhatsApp istemcisini başlat
  async initialize() {
    try {
      this.client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        }
      });

      // QR kod olayı
      this.client.on('qr', async (qr) => {
        console.log('QR kod alındı');
        try {
          this.qrCode = await qrcode.toDataURL(qr, {
            width: 256,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'H'
          });
        } catch (error) {
          console.error('QR kod oluşturulamadı:', error);
        }
      });

      // Bağlantı hazır olayı
      this.client.on('ready', () => {
        console.log('WhatsApp bağlandı!');
        this.isConnected = true;
        this.phoneNumber = this.client.info.wid.user;
        this.lastSeen = new Date().toLocaleString('tr-TR');
        this.qrCode = null;
      });

      // Bağlantı kesildi olayı
      this.client.on('disconnected', (reason) => {
        console.log('WhatsApp bağlantısı kesildi:', reason);
        this.isConnected = false;
        this.phoneNumber = null;
        this.lastSeen = null;
        this.qrCode = null;
      });

      // İstemciyi başlat
      await this.client.initialize();
      return true;
    } catch (error) {
      console.error('WhatsApp başlatılamadı:', error);
      return false;
    }
  }

  // QR kod oluştur
  async generateQR() {
    if (!this.client) {
      await this.initialize();
    }
    
    // QR kod oluşana kadar bekle
    let attempts = 0;
    while (!this.qrCode && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    return this.qrCode;
  }

  // Tek mesaj gönder
  async sendMessage(phoneNumber, message) {
    if (!this.isConnected) {
      throw new Error('WhatsApp bağlı değil');
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      const chatId = `${formattedNumber}@c.us`;
      
      const result = await this.client.sendMessage(chatId, message);
      return {
        success: true,
        messageId: result.id._serialized,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Mesaj gönderilemedi:', error);
      throw new Error('Mesaj gönderilemedi: ' + error.message);
    }
  }

  // Toplu mesaj gönder
  async sendBulkMessage(phoneNumbers, message) {
    if (!this.isConnected) {
      throw new Error('WhatsApp bağlı değil');
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const phoneNumber of phoneNumbers) {
      try {
        const result = await this.sendMessage(phoneNumber, message);
        results.push({
          phoneNumber,
          success: true,
          messageId: result.messageId
        });
        successCount++;
        
        // Rate limiting - her mesaj arasında 1 saniye bekle
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          phoneNumber,
          success: false,
          error: error.message
        });
        failureCount++;
      }
    }

    return {
      success: true,
      totalSent: successCount,
      totalFailed: failureCount,
      results
    };
  }

  // Telefon numarasını formatla
  formatPhoneNumber(phoneNumber) {
    // Sadece rakamları al
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Türkiye numarası için
    if (cleaned.startsWith('90')) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // 10 haneli değilse hata ver
    if (cleaned.length !== 10) {
      throw new Error('Geçersiz telefon numarası formatı');
    }
    
    return `90${cleaned}`;
  }

  // Durum bilgisi al
  getStatus() {
    return {
      isConnected: this.isConnected,
      connectionStatus: this.isConnected ? 'Bağlı' : 'Bağlantı yok',
      qrCode: this.qrCode,
      phoneNumber: this.phoneNumber,
      lastSeen: this.lastSeen
    };
  }

  // Bağlantıyı kes
  async disconnect() {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
    }
    this.isConnected = false;
    this.phoneNumber = null;
    this.lastSeen = null;
    this.qrCode = null;
  }
}

module.exports = WhatsAppService; 