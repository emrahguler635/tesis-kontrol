import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { apiService } from '../services/api';
import { 
  MessageSquare, 
  Send, 
  Users, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  MapPin,
  FileText,
  RefreshCw,
  QrCode,
  Scan,
  Phone
} from 'lucide-react';

interface WhatsAppStatus {
  isConnected: boolean;
  connectionStatus: string;
  qrCode: string | null;
  phoneNumber: string | null;
  lastSeen: string | null;
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
  const [status, setStatus] = useState<WhatsAppStatus>({
    isConnected: false,
    connectionStatus: 'Bağlantı yok',
    qrCode: null,
    phoneNumber: null,
    lastSeen: null
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'custom' | 'daily' | 'emergency'>('custom');
  const [showQR, setShowQR] = useState(false);
  
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
      const response = await apiService.getWhatsAppStatus();
      setStatus(response.data);
      
      // Eğer bağlıysa QR'ı gizle
      if (response.data.isConnected) {
        setShowQR(false);
      }
    } catch (error) {
      console.error('WhatsApp durumu alınamadı:', error);
      setStatus({
        isConnected: false,
        connectionStatus: 'Bağlantı hatası',
        qrCode: null,
        phoneNumber: null,
        lastSeen: null
      });
    }
  };

  // QR kod oluştur
  const generateQR = async () => {
    setLoading(true);
    try {
      const response = await apiService.generateWhatsAppQR();
      if (response.success) {
        setStatus(prev => ({
          ...prev,
          qrCode: response.data.qrCode,
          connectionStatus: 'QR kod hazır'
        }));
        setShowQR(true);
      }
    } catch (error) {
      console.error('QR kod oluşturulamadı:', error);
      alert('QR kod oluşturulamadı!');
    } finally {
      setLoading(false);
    }
  };

  // Bağlantıyı kes
  const disconnect = async () => {
    try {
      await apiService.disconnectWhatsApp();
      setStatus({
        isConnected: false,
        connectionStatus: 'Bağlantı kesildi',
        qrCode: null,
        phoneNumber: null,
        lastSeen: null
      });
      setShowQR(false);
    } catch (error) {
      console.error('Bağlantı kesilemedi:', error);
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
    if (!status.isConnected) {
      alert('Önce WhatsApp\'a bağlanın!');
      return;
    }

    if (!message.trim() || !phoneNumbers.trim()) {
      alert('Mesaj ve telefon numarası gerekli!');
      return;
    }

    setLoading(true);
    try {
      const numbers = phoneNumbers.split(',').map(n => n.trim());
      const response = await apiService.sendWhatsAppMessage(numbers[0], message);

      if (response.success) {
        alert('Mesaj başarıyla gönderildi!');
        setMessage('');
      } else {
        alert('Mesaj gönderilemedi: ' + response.message);
      }
    } catch (error) {
      console.error('Mesaj gönderilemedi:', error);
      alert('Mesaj gönderilemedi!');
    } finally {
      setLoading(false);
    }
  };

  // Toplu mesaj gönder
  const sendBulkMessage = async () => {
    if (!status.isConnected) {
      alert('Önce WhatsApp\'a bağlanın!');
      return;
    }

    if (!message.trim() || !phoneNumbers.trim()) {
      alert('Mesaj ve telefon numaraları gerekli!');
      return;
    }

    setLoading(true);
    try {
      const numbers = phoneNumbers.split(',').map(n => n.trim());
      const response = await apiService.sendWhatsAppBulkMessage(numbers, message);

      if (response.success) {
        alert(`${response.data.totalSent} numaraya mesaj başarıyla gönderildi!`);
        setMessage('');
        setPhoneNumbers('');
      } else {
        alert('Mesajlar gönderilemedi: ' + response.message);
      }
    } catch (error) {
      console.error('Toplu mesaj gönderilemedi:', error);
      alert('Toplu mesaj gönderilemedi!');
    } finally {
      setLoading(false);
    }
  };

  // Günlük bildirim gönder
  const sendDailyNotification = async () => {
    if (!status.isConnected) {
      alert('Önce WhatsApp\'a bağlanın!');
      return;
    }

    if (!workData.facility || !workData.location || workData.tasks.length === 0) {
      alert('Günlük iş programı bilgileri eksik!');
      return;
    }

    setLoading(true);
    try {
      const dailyMessage = `📅 GÜNLÜK İŞ PROGRAMI

🏢 Tesis: ${workData.facility}
📍 Konum: ${workData.location}

📋 Yapılacak İşler:
${workData.tasks.map((task, index) => `${index + 1}. ${task}`).join('\n')}

${workData.notes ? `📝 Notlar: ${workData.notes}` : ''}

Bağcılar Belediyesi`;

      const numbers = phoneNumbers.split(',').map(n => n.trim());
      const response = await apiService.sendWhatsAppBulkMessage(numbers, dailyMessage);

      if (response.success) {
        alert('Günlük bildirim başarıyla gönderildi!');
      } else {
        alert('Günlük bildirim gönderilemedi: ' + response.message);
      }
    } catch (error) {
      console.error('Günlük bildirim gönderilemedi:', error);
      alert('Günlük bildirim gönderilemedi!');
    } finally {
      setLoading(false);
    }
  };

  // Acil durum bildirimi gönder
  const sendEmergencyNotification = async () => {
    if (!status.isConnected) {
      alert('Önce WhatsApp\'a bağlanın!');
      return;
    }

    if (!emergencyData.type || !emergencyData.location || !emergencyData.description) {
      alert('Acil durum bilgileri eksik!');
      return;
    }

    setLoading(true);
    try {
      const emergencyMessage = `🚨 ACİL DURUM BİLDİRİMİ

⚠️ Tür: ${emergencyData.type}
📍 Konum: ${emergencyData.location}
📝 Açıklama: ${emergencyData.description}
🛠️ Yapılacak: ${emergencyData.action}

⏰ Tarih: ${new Date().toLocaleString('tr-TR')}

Bağcılar Belediyesi`;

      const numbers = phoneNumbers.split(',').map(n => n.trim());
      const response = await apiService.sendWhatsAppBulkMessage(numbers, emergencyMessage);

      if (response.success) {
        alert('Acil durum bildirimi başarıyla gönderildi!');
      } else {
        alert('Acil durum bildirimi gönderilemedi: ' + response.message);
      }
    } catch (error) {
      console.error('Acil durum bildirimi gönderilemedi:', error);
      alert('Acil durum bildirimi gönderilemedi!');
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
        <button
          onClick={checkStatus}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Yenile</span>
        </button>
      </div>

      {/* WhatsApp Bağlantı Durumu */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${status.isConnected ? 'bg-green-100' : 'bg-red-100'}`}>
              {status.isConnected ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">WhatsApp Bağlantı Durumu</h3>
              <p className="text-sm text-gray-600">
                Durum: {status.connectionStatus}
                {status.phoneNumber && ` | ${status.phoneNumber}`}
              </p>
              {status.lastSeen && (
                <p className="text-xs text-gray-500">Son görülme: {status.lastSeen}</p>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            {!status.isConnected && !showQR && (
              <button
                onClick={generateQR}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <QrCode className="h-4 w-4" />
                <span>QR Kod Oluştur</span>
              </button>
            )}
            
            {status.isConnected && (
              <button
                onClick={disconnect}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <XCircle className="h-4 w-4" />
                <span>Bağlantıyı Kes</span>
              </button>
            )}
          </div>
        </div>

        {/* QR Kod Görüntüleme */}
        {showQR && status.qrCode && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">QR Kod Okutun</h4>
              <button
                onClick={() => setShowQR(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <img 
                  src={status.qrCode} 
                  alt="WhatsApp QR Code" 
                  className="w-64 h-64 object-contain"
                />
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  WhatsApp uygulamanızda QR kodu okutun
                </p>
                <p className="text-xs text-blue-600 mb-4">
                  QR kod okutulduktan sonra otomatik olarak bağlanacaktır
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Mesaj Gönderme Formu */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mesaj Gönder</h3>
        
        <div className="space-y-4">
          {/* Mesaj Şablonu */}
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
              <option value="emergency">Acil Durum Bildirimi</option>
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
                placeholder="Göndermek istediğiniz mesajı yazın..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Günlük İş Programı */}
          {selectedTemplate === 'daily' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  Yapılacak İşler
                </label>
                <div className="space-y-2">
                  {workData.tasks.map((task, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={task}
                        onChange={(e) => updateTask(index, e.target.value)}
                        placeholder={`${index + 1}. İş açıklaması`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => removeTask(index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addTask}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>İş Ekle</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notlar
                </label>
                <textarea
                  value={workData.notes}
                  onChange={(e) => setWorkData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ek notlar..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Acil Durum Bildirimi */}
          {selectedTemplate === 'emergency' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Acil Durum Türü
                  </label>
                  <input
                    type="text"
                    value={emergencyData.type}
                    onChange={(e) => setEmergencyData(prev => ({ ...prev, type: e.target.value }))}
                    placeholder="Örn: Su kesintisi, Elektrik kesintisi"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Konum
                  </label>
                  <input
                    type="text"
                    value={emergencyData.location}
                    onChange={(e) => setEmergencyData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Konum"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={emergencyData.description}
                  onChange={(e) => setEmergencyData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Acil durum açıklaması..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yapılacak İşlem
                </label>
                <textarea
                  value={emergencyData.action}
                  onChange={(e) => setEmergencyData(prev => ({ ...prev, action: e.target.value }))}
                  placeholder="Yapılacak işlem..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Butonlar */}
          <div className="flex space-x-4 pt-4">
            <button
              onClick={sendMessage}
              disabled={loading || !status.isConnected}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>Tek Mesaj Gönder</span>
            </button>
            
            <button
              onClick={selectedTemplate === 'custom' ? sendBulkMessage : 
                       selectedTemplate === 'daily' ? sendDailyNotification : 
                       sendEmergencyNotification}
              disabled={loading || !status.isConnected}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Users className="h-4 w-4" />
              <span>Toplu Mesaj Gönder</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
} 