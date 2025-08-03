import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { api } from '../services/api';
import { 
  MessageSquare, 
  Smartphone, 
  QrCode, 
  Send, 
  Users, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  MapPin,
  FileText
} from 'lucide-react';

interface WhatsAppStatus {
  isReady: boolean;
  connectionStatus: string;
  qrCode: string | null;
}

interface WorkData {
  facility: string;
  location: string;
  tasks: string[];
  notes: string;
}

interface EmergencyData {
  type: string;
  location: string;
  description: string;
  action: string;
}

export function WhatsAppNotifications() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'custom' | 'daily' | 'emergency'>('custom');
  
  // Günlük iş programı verisi
  const [workData, setWorkData] = useState<WorkData>({
    facility: '',
    location: '',
    tasks: [''],
    notes: ''
  });

  // Acil durum verisi
  const [emergencyData, setEmergencyData] = useState<EmergencyData>({
    type: '',
    location: '',
    description: '',
    action: ''
  });

  // WhatsApp durumunu kontrol et
  const checkStatus = async () => {
    try {
      const response = await api.get('/whatsapp/status');
      setStatus(response.data.data);
    } catch (error) {
      console.error('WhatsApp durumu alınamadı:', error);
    }
  };

  // Durumu periyodik olarak kontrol et
  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Tek mesaj gönder
  const sendMessage = async () => {
    if (!message.trim() || !phoneNumbers.trim()) {
      alert('Mesaj ve telefon numarası gerekli!');
      return;
    }

    setLoading(true);
    try {
      const numbers = phoneNumbers.split(',').map(n => n.trim());
      const response = await api.post('/whatsapp/send', {
        phoneNumber: numbers[0],
        message: message
      });

      if (response.data.success) {
        alert('Mesaj başarıyla gönderildi!');
        setMessage('');
      } else {
        alert('Mesaj gönderilemedi: ' + response.data.data.error);
      }
    } catch (error) {
      alert('Mesaj gönderilemedi!');
    } finally {
      setLoading(false);
    }
  };

  // Toplu mesaj gönder
  const sendBulkMessage = async () => {
    if (!message.trim() || !phoneNumbers.trim()) {
      alert('Mesaj ve telefon numaraları gerekli!');
      return;
    }

    setLoading(true);
    try {
      const numbers = phoneNumbers.split(',').map(n => n.trim());
      const response = await api.post('/whatsapp/send-bulk', {
        phoneNumbers: numbers,
        message: message
      });

      if (response.data.success) {
        alert(`Toplu mesaj gönderildi! Başarılı: ${response.data.data.totalSent}, Başarısız: ${response.data.data.totalFailed}`);
        setMessage('');
      } else {
        alert('Toplu mesaj gönderilemedi: ' + response.data.data.error);
      }
    } catch (error) {
      alert('Toplu mesaj gönderilemedi!');
    } finally {
      setLoading(false);
    }
  };

  // Günlük iş programı bildirimi gönder
  const sendDailyNotification = async () => {
    if (!phoneNumbers.trim()) {
      alert('Telefon numaraları gerekli!');
      return;
    }

    setLoading(true);
    try {
      const numbers = phoneNumbers.split(',').map(n => n.trim());
      const response = await api.post('/whatsapp/send-daily-notification', {
        phoneNumbers: numbers,
        workData: workData
      });

      if (response.data.success) {
        alert(`Günlük iş programı bildirimi gönderildi! Başarılı: ${response.data.data.totalSent}, Başarısız: ${response.data.data.totalFailed}`);
      } else {
        alert('Bildirim gönderilemedi: ' + response.data.data.error);
      }
    } catch (error) {
      alert('Bildirim gönderilemedi!');
    } finally {
      setLoading(false);
    }
  };

  // Acil durum bildirimi gönder
  const sendEmergencyNotification = async () => {
    if (!phoneNumbers.trim()) {
      alert('Telefon numaraları gerekli!');
      return;
    }

    setLoading(true);
    try {
      const numbers = phoneNumbers.split(',').map(n => n.trim());
      const response = await api.post('/whatsapp/send-emergency', {
        phoneNumbers: numbers,
        emergencyData: emergencyData
      });

      if (response.data.success) {
        alert(`Acil durum bildirimi gönderildi! Başarılı: ${response.data.data.totalSent}, Başarısız: ${response.data.data.totalFailed}`);
      } else {
        alert('Bildirim gönderilemedi: ' + response.data.data.error);
      }
    } catch (error) {
      alert('Bildirim gönderilemedi!');
    } finally {
      setLoading(false);
    }
  };

  // Görev ekle
  const addTask = () => {
    setWorkData(prev => ({
      ...prev,
      tasks: [...prev.tasks, '']
    }));
  };

  // Görev güncelle
  const updateTask = (index: number, value: string) => {
    setWorkData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => i === index ? value : task)
    }));
  };

  // Görev sil
  const removeTask = (index: number) => {
    setWorkData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp Bildirimleri</h1>
        <div className="flex items-center space-x-2">
          <Smartphone className="h-6 w-6 text-blue-600" />
          <span className="text-sm text-gray-600">WhatsApp Entegrasyonu</span>
        </div>
      </div>

      {/* WhatsApp Durumu */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">WhatsApp Bağlantı Durumu</h2>
          <button
            onClick={checkStatus}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
          >
            Yenile
          </button>
        </div>
        
        <div className="mt-4 space-y-3">
          <div className="flex items-center space-x-2">
            {status?.isReady ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="text-sm">
              Durum: {status?.connectionStatus === 'connected' ? 'Bağlı' : 
                      status?.connectionStatus === 'qr_ready' ? 'QR Kod Bekleniyor' : 
                      status?.connectionStatus === 'disconnected' ? 'Bağlantı Kesildi' : 
                      status?.connectionStatus === 'auth_failed' ? 'Kimlik Doğrulama Başarısız' : 'Bilinmiyor'}
            </span>
          </div>

          {status?.qrCode && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <QrCode className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">QR Kod</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                WhatsApp uygulamanızda QR kodu tarayın:
              </p>
              <div className="bg-white p-4 rounded border">
                <pre className="text-xs overflow-auto">{status.qrCode}</pre>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Mesaj Gönderme */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Mesaj Gönder</h2>
        
        <div className="space-y-4">
          {/* Şablon Seçimi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mesaj Şablonu
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="custom">Özel Mesaj</option>
              <option value="daily">Günlük İş Programı</option>
              <option value="emergency">Acil Durum</option>
            </select>
          </div>

          {/* Telefon Numaraları */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefon Numaraları (virgülle ayırın)
            </label>
            <input
              type="text"
              value={phoneNumbers}
              onChange={(e) => setPhoneNumbers(e.target.value)}
              placeholder="05551234567, 05559876543"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Özel Mesaj */}
          {selectedTemplate === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mesaj
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Göndermek istediğiniz mesajı yazın..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Günlük İş Programı Şablonu */}
          {selectedTemplate === 'daily' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="inline h-4 w-4 mr-1" />
                    Tesis
                  </label>
                  <input
                    type="text"
                    value={workData.facility}
                    onChange={(e) => setWorkData(prev => ({ ...prev, facility: e.target.value }))}
                    placeholder="Tesis adı"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Konum
                  </label>
                  <input
                    type="text"
                    value={workData.location}
                    onChange={(e) => setWorkData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Konum"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline h-4 w-4 mr-1" />
                  Yapılacak İşler
                </label>
                {workData.tasks.map((task, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={task}
                      onChange={(e) => updateTask(index, e.target.value)}
                      placeholder={`${index + 1}. İş açıklaması`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => removeTask(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addTask}
                  className="mt-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                >
                  + İş Ekle
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notlar
                </label>
                <textarea
                  value={workData.notes}
                  onChange={(e) => setWorkData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Ek notlar..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Acil Durum Şablonu */}
          {selectedTemplate === 'emergency' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <AlertTriangle className="inline h-4 w-4 mr-1" />
                    Acil Durum Türü
                  </label>
                  <input
                    type="text"
                    value={emergencyData.type}
                    onChange={(e) => setEmergencyData(prev => ({ ...prev, type: e.target.value }))}
                    placeholder="Örn: Su kesintisi, Elektrik arızası"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Konum
                  </label>
                  <input
                    type="text"
                    value={emergencyData.location}
                    onChange={(e) => setEmergencyData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Acil durum konumu"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline h-4 w-4 mr-1" />
                  Açıklama
                </label>
                <textarea
                  value={emergencyData.description}
                  onChange={(e) => setEmergencyData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="Acil durum detayları..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <AlertTriangle className="inline h-4 w-4 mr-1" />
                  Acil Eylem
                </label>
                <textarea
                  value={emergencyData.action}
                  onChange={(e) => setEmergencyData(prev => ({ ...prev, action: e.target.value }))}
                  rows={2}
                  placeholder="Yapılması gereken acil eylem..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Gönder Butonları */}
          <div className="flex space-x-3">
            {selectedTemplate === 'custom' && (
              <>
                <button
                  onClick={sendMessage}
                  disabled={loading || !status?.isReady}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  <span>Tek Mesaj Gönder</span>
                </button>
                <button
                  onClick={sendBulkMessage}
                  disabled={loading || !status?.isReady}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Users className="h-4 w-4" />
                  <span>Toplu Mesaj Gönder</span>
                </button>
              </>
            )}

            {selectedTemplate === 'daily' && (
              <button
                onClick={sendDailyNotification}
                disabled={loading || !status?.isReady}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Clock className="h-4 w-4" />
                <span>Günlük İş Programı Gönder</span>
              </button>
            )}

            {selectedTemplate === 'emergency' && (
              <button
                onClick={sendEmergencyNotification}
                disabled={loading || !status?.isReady}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Acil Durum Bildirimi Gönder</span>
              </button>
            )}
          </div>

          {loading && (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Mesaj gönderiliyor...</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
} 