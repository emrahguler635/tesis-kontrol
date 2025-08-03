const WhatsAppService = require('../backend/whatsapp-service');

// WhatsApp servisini başlat
const whatsappService = new WhatsAppService();

// WhatsApp servisini başlat
whatsappService.initialize();

// WhatsApp durumunu al
app.get('/api/whatsapp/status', (req, res) => {
    try {
        const status = whatsappService.getStatus();
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Tek numaraya mesaj gönder
app.post('/api/whatsapp/send', async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;

        if (!phoneNumber || !message) {
            return res.status(400).json({
                success: false,
                error: 'Telefon numarası ve mesaj gerekli!'
            });
        }

        const result = await whatsappService.sendMessage(phoneNumber, message);
        
        res.json({
            success: result.success,
            data: result
        });

    } catch (error) {
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

        if (!phoneNumbers || !Array.isArray(phoneNumbers) || !message) {
            return res.status(400).json({
                success: false,
                error: 'Telefon numaraları listesi ve mesaj gerekli!'
            });
        }

        const result = await whatsappService.sendBulkMessage(phoneNumbers, message);
        
        res.json({
            success: result.success,
            data: result
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Günlük iş programı bildirimi gönder
app.post('/api/whatsapp/send-daily-notification', async (req, res) => {
    try {
        const { phoneNumbers, workData } = req.body;

        if (!phoneNumbers || !Array.isArray(phoneNumbers) || !workData) {
            return res.status(400).json({
                success: false,
                error: 'Telefon numaraları ve iş verisi gerekli!'
            });
        }

        // Mesaj şablonunu oluştur
        const message = createDailyWorkMessage(workData);
        
        const result = await whatsappService.sendBulkMessage(phoneNumbers, message);
        
        res.json({
            success: result.success,
            data: result
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Günlük iş programı mesaj şablonu oluştur
function createDailyWorkMessage(workData) {
    const today = new Date().toLocaleDateString('tr-TR');
    
    let message = `🏗️ *GÜNLÜK İŞ PROGRAMI* 🏗️\n`;
    message += `📅 Tarih: ${today}\n`;
    message += `⏰ Saat: ${new Date().toLocaleTimeString('tr-TR')}\n\n`;
    
    if (workData.facility) {
        message += `🏢 *Tesis:* ${workData.facility}\n`;
    }
    
    if (workData.location) {
        message += `📍 *Konum:* ${workData.location}\n`;
    }
    
    if (workData.tasks && workData.tasks.length > 0) {
        message += `\n📋 *Yapılacak İşler:*\n`;
        workData.tasks.forEach((task, index) => {
            message += `${index + 1}. ${task}\n`;
        });
    }
    
    if (workData.notes) {
        message += `\n📝 *Notlar:* ${workData.notes}\n`;
    }
    
    message += `\n✅ *Bağcılar Belediyesi*\n`;
    message += `📱 WorkPulse – İş Nabzı Sistemi`;
    
    return message;
}

// Acil durum bildirimi gönder
app.post('/api/whatsapp/send-emergency', async (req, res) => {
    try {
        const { phoneNumbers, emergencyData } = req.body;

        if (!phoneNumbers || !Array.isArray(phoneNumbers) || !emergencyData) {
            return res.status(400).json({
                success: false,
                error: 'Telefon numaraları ve acil durum verisi gerekli!'
            });
        }

        // Acil durum mesaj şablonunu oluştur
        const message = createEmergencyMessage(emergencyData);
        
        const result = await whatsappService.sendBulkMessage(phoneNumbers, message);
        
        res.json({
            success: result.success,
            data: result
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Acil durum mesaj şablonu oluştur
function createEmergencyMessage(emergencyData) {
    const now = new Date();
    
    let message = `🚨 *ACİL DURUM BİLDİRİMİ* 🚨\n`;
    message += `⏰ Tarih/Saat: ${now.toLocaleString('tr-TR')}\n\n`;
    
    if (emergencyData.type) {
        message += `🔴 *Durum:* ${emergencyData.type}\n`;
    }
    
    if (emergencyData.location) {
        message += `📍 *Konum:* ${emergencyData.location}\n`;
    }
    
    if (emergencyData.description) {
        message += `📝 *Açıklama:* ${emergencyData.description}\n`;
    }
    
    if (emergencyData.action) {
        message += `⚡ *Acil Eylem:* ${emergencyData.action}\n`;
    }
    
    message += `\n🚨 *Lütfen hemen müdahale edin!*\n`;
    message += `✅ *Bağcılar Belediyesi*`;
    
    return message;
}

module.exports = app; 