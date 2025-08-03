const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

class WhatsAppService {
    constructor() {
        this.client = null;
        this.isReady = false;
        this.qrCode = null;
        this.connectionStatus = 'disconnected';
    }

    // WhatsApp istemcisini başlat
    initialize() {
        try {
            this.client = new Client({
                authStrategy: new LocalAuth(),
                puppeteer: {
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                }
            });

            // QR kod olayı
            this.client.on('qr', (qr) => {
                console.log('📱 QR Kod alındı:');
                qrcode.generate(qr, { small: true });
                this.qrCode = qr;
                this.connectionStatus = 'qr_ready';
            });

            // Hazır olayı
            this.client.on('ready', () => {
                console.log('✅ WhatsApp bağlantısı hazır!');
                this.isReady = true;
                this.connectionStatus = 'connected';
                this.qrCode = null;
            });

            // Bağlantı kesildi
            this.client.on('disconnected', (reason) => {
                console.log('❌ WhatsApp bağlantısı kesildi:', reason);
                this.isReady = false;
                this.connectionStatus = 'disconnected';
            });

            // Kimlik doğrulama başarısız
            this.client.on('auth_failure', (msg) => {
                console.log('❌ WhatsApp kimlik doğrulama başarısız:', msg);
                this.connectionStatus = 'auth_failed';
            });

            // İstemciyi başlat
            this.client.initialize();
            console.log('🚀 WhatsApp servisi başlatılıyor...');

        } catch (error) {
            console.error('❌ WhatsApp servisi başlatılamadı:', error);
            throw error;
        }
    }

    // Tek numaraya mesaj gönder
    async sendMessage(phoneNumber, message) {
        try {
            if (!this.isReady) {
                throw new Error('WhatsApp bağlantısı hazır değil!');
            }

            // Telefon numarasını formatla (90 ile başlayacak şekilde)
            const formattedNumber = this.formatPhoneNumber(phoneNumber);
            
            // Mesajı gönder
            const result = await this.client.sendMessage(`${formattedNumber}@c.us`, message);
            
            console.log(`✅ Mesaj gönderildi: ${formattedNumber}`);
            return {
                success: true,
                messageId: result.id._serialized,
                timestamp: result.timestamp
            };

        } catch (error) {
            console.error('❌ Mesaj gönderilemedi:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Toplu mesaj gönder
    async sendBulkMessage(phoneNumbers, message) {
        try {
            if (!this.isReady) {
                throw new Error('WhatsApp bağlantısı hazır değil!');
            }

            const results = [];
            
            for (const phoneNumber of phoneNumbers) {
                const result = await this.sendMessage(phoneNumber, message);
                results.push({
                    phoneNumber,
                    ...result
                });
                
                // Rate limiting - her mesaj arasında 1 saniye bekle
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            return {
                success: true,
                results,
                totalSent: results.filter(r => r.success).length,
                totalFailed: results.filter(r => !r.success).length
            };

        } catch (error) {
            console.error('❌ Toplu mesaj gönderilemedi:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Telefon numarasını formatla
    formatPhoneNumber(phoneNumber) {
        // Türkiye numarası formatı: 90XXXXXXXXXX
        let formatted = phoneNumber.replace(/\D/g, ''); // Sadece rakamları al
        
        // 0 ile başlıyorsa kaldır
        if (formatted.startsWith('0')) {
            formatted = formatted.substring(1);
        }
        
        // 90 ile başlamıyorsa ekle
        if (!formatted.startsWith('90')) {
            formatted = '90' + formatted;
        }
        
        return formatted;
    }

    // Bağlantı durumunu al
    getStatus() {
        return {
            isReady: this.isReady,
            connectionStatus: this.connectionStatus,
            qrCode: this.qrCode
        };
    }

    // Servisi durdur
    async disconnect() {
        try {
            if (this.client) {
                await this.client.destroy();
                this.isReady = false;
                this.connectionStatus = 'disconnected';
                console.log('✅ WhatsApp servisi durduruldu');
            }
        } catch (error) {
            console.error('❌ WhatsApp servisi durdurulamadı:', error);
        }
    }
}

module.exports = WhatsAppService; 