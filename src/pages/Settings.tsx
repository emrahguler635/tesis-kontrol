import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Upload, Trash2, CheckCircle, GripVertical, Save, RotateCcw, Clock } from 'lucide-react';
import { useAuthStore } from '../store';

export function Settings() {
  // Logo yükleme için state
  const [logo, setLogo] = useState(() => {
    // Önce localStorage'dan dene
    const storedLogo = localStorage.getItem('appLogo');
    if (storedLogo) return storedLogo;
    
    // Yoksa sessionStorage'dan dene
    const sessionLogo = sessionStorage.getItem('appLogo');
    if (sessionLogo) return sessionLogo;
    
    // Hiçbiri yoksa varsayılan logo
    return '/vite.svg';
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadMsg, setUploadMsg] = useState('');

  // Oturum süresi ayarları
  const { sessionTimeout, resetSessionTimer } = useAuthStore();
  const [sessionDuration, setSessionDuration] = useState(() => {
    const saved = localStorage.getItem('sessionDuration');
    return saved ? parseInt(saved) : 30; // Varsayılan 30 dakika
  });
  const [sessionMsg, setSessionMsg] = useState('');

  // Mevcut logo dosyasını kullan
  const useExistingLogo = () => {
    const logoPath = '/logo.svg';
    setLogo(logoPath);
    
    // Hem localStorage hem sessionStorage'a kaydet
    localStorage.setItem('appLogo', logoPath);
    sessionStorage.setItem('appLogo', logoPath);
    
    // Favicon'u da güncelle
    updateFavicon(logoPath);
    
    setUploadMsg('Mevcut logo kullanılıyor!');
    
    // 3 saniye sonra mesajı temizle
    setTimeout(() => setUploadMsg(''), 3000);
  };

  // Oturum süresini kaydet
  const saveSessionDuration = () => {
    localStorage.setItem('sessionDuration', sessionDuration.toString());
    
    // Store'u güncelle
    const newTimeout = sessionDuration * 60 * 1000; // Dakikayı milisaniyeye çevir
    useAuthStore.setState({ sessionTimeout: newTimeout });
    
    // Oturum süresini sıfırla
    resetSessionTimer();
    
    setSessionMsg('Oturum süresi kaydedildi!');
    setTimeout(() => setSessionMsg(''), 3000);
  };

  // Menü sırasını localStorage'dan al
  const getMenuItems = () => {
    const savedOrder = localStorage.getItem('menuOrder');
    if (savedOrder) {
      try {
        return JSON.parse(savedOrder);
      } catch (error) {
        console.error('Menü sırası yüklenirken hata:', error);
      }
    }
    
    // Varsayılan menü sırası
    return [
      { id: 'home', label: 'Ana Sayfa', icon: '🏠', to: '/', enabled: true },
      { id: 'facilities', label: 'Tesisler', icon: '🏢', to: '/facilities', enabled: true },
      { id: 'daily', label: 'Günlük İş Programı', icon: '📅', to: '/daily-checks', enabled: true },
      { id: 'weekly', label: 'Toplam Yapılan İşler', icon: '⏰', to: '/haftalik', enabled: true },
      { id: 'reports', label: 'Raporlar', icon: '📊', to: '/reports', enabled: true },
      { id: 'messages', label: 'Mesaj Yönetimi', icon: '💬', to: '/messages', enabled: true },
      { id: 'bagtv', label: 'BağTV', icon: '📺', to: '/bagtv', enabled: true },
      { id: 'data-control', label: 'Veri Kontrol', icon: '🗄️', to: '/data-control', enabled: true },
      { id: 'approvals', label: 'Onay Yönetimi', icon: '✅', to: '/approvals', enabled: true },
      { id: 'completed-works', label: 'Yapılan İşler', icon: '✅', to: '/completed-works', enabled: true },
      { id: 'user-management', label: 'Kullanıcı Yönetimi', icon: '👥', to: '/user-management', enabled: true },
      { id: 'settings', label: 'Ayarlar', icon: '⚙️', to: '/settings', enabled: true },
    ];
  };

  const [menuItems, setMenuItems] = useState(() => {
    const savedOrder = localStorage.getItem('menuOrder');
    if (savedOrder) {
      try {
        return JSON.parse(savedOrder);
      } catch (error) {
        console.error('Menü sırası yüklenirken hata:', error);
      }
    }
    
    // Varsayılan menü sırası
    return [
      { id: 'home', label: 'Ana Sayfa', icon: '🏠', to: '/', enabled: true },
      { id: 'facilities', label: 'Tesisler', icon: '🏢', to: '/facilities', enabled: true },
      { id: 'daily', label: 'Günlük İş Programı', icon: '📅', to: '/daily-checks', enabled: true },
      { id: 'weekly', label: 'Toplam Yapılan İşler', icon: '⏰', to: '/haftalik', enabled: true },
      { id: 'reports', label: 'Raporlar', icon: '📊', to: '/reports', enabled: true },
      { id: 'messages', label: 'Mesaj Yönetimi', icon: '💬', to: '/messages', enabled: true },
      { id: 'bagtv', label: 'BağTV', icon: '📺', to: '/bagtv', enabled: true },
      { id: 'data-control', label: 'Veri Kontrol', icon: '🗄️', to: '/data-control', enabled: true },
      { id: 'approvals', label: 'Onay Yönetimi', icon: '✅', to: '/approvals', enabled: true },
      { id: 'completed-works', label: 'Yapılan İşler', icon: '✅', to: '/completed-works', enabled: true },
      { id: 'user-management', label: 'Kullanıcı Yönetimi', icon: '👥', to: '/user-management', enabled: true },
      { id: 'settings', label: 'Ayarlar', icon: '⚙️', to: '/settings', enabled: true },
    ];
  });

  const [menuMsg, setMenuMsg] = useState('');

  // Logo seçildiğinde base64'e çevir ve state+localStorage'a kaydet
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = reader.result as string;
        setLogo(result);
        
        // Hem localStorage hem sessionStorage'a kaydet
        localStorage.setItem('appLogo', result);
        sessionStorage.setItem('appLogo', result);
        
        // Favicon'u da güncelle
        updateFavicon(result);
        
        setUploadMsg('Logo başarıyla yüklendi!');
        
        // 3 saniye sonra mesajı temizle
        setTimeout(() => setUploadMsg(''), 3000);
      } catch (error) {
        console.error('Logo yükleme hatası:', error);
        setUploadMsg('Logo yüklenirken hata oluştu!');
      }
    };
    
    reader.onerror = () => {
      setUploadMsg('Logo yüklenirken hata oluştu!');
    };
    
    reader.readAsDataURL(file);
    setLogoFile(file);
  };

  // Favicon'u güncelle
  const updateFavicon = (logoData: string) => {
    try {
      // Mevcut favicon link'ini bul veya oluştur
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      
      favicon.href = logoData;
      favicon.type = 'image/png';
      
      // Sayfa başlığını da güncelle
      document.title = 'Tesis Kontrol Sistemi';
      
    } catch (error) {
      console.error('Favicon güncelleme hatası:', error);
    }
  };

  // Logo'yu temizle
  const handleClearLogo = () => {
    setLogo('/vite.svg');
    localStorage.removeItem('appLogo');
    sessionStorage.removeItem('appLogo');
    
    // Favicon'u da temizle
    updateFavicon('/vite.svg');
    
    setUploadMsg('Logo temizlendi!');
    setTimeout(() => setUploadMsg(''), 3000);
  };

  // Menü sırasını kaydet
  const saveMenuOrder = () => {
    try {
      localStorage.setItem('menuOrder', JSON.stringify(menuItems));
      
      // Sidebar'a bildirim gönder
      window.dispatchEvent(new CustomEvent('menuOrderChanged'));
      
      setMenuMsg('Menü sırası kaydedildi!');
      setTimeout(() => setMenuMsg(''), 3000);
    } catch (error) {
      console.error('Menü sırası kaydedilirken hata:', error);
      setMenuMsg('Menü sırası kaydedilirken hata oluştu!');
    }
  };

  // Menü sırasını sıfırla
  const resetMenuOrder = () => {
    const defaultItems = getMenuItems();
    setMenuItems(defaultItems);
    localStorage.removeItem('menuOrder');
    setMenuMsg('Menü sırası sıfırlandı!');
    setTimeout(() => setMenuMsg(''), 3000);
  };

  // Menü öğesini etkinleştir/devre dışı bırak
  const toggleMenuItem = (id: string) => {
    setMenuItems(prev => prev.map(item => 
      item.id === id ? { ...item, enabled: !item.enabled } : item
    ));
  };

  // Drag & Drop için state
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    setMenuItems(prev => {
      const items = [...prev];
      const draggedIndex = items.findIndex(item => item.id === draggedItem);
      const targetIndex = items.findIndex(item => item.id === targetId);
      
      const [draggedItemObj] = items.splice(draggedIndex, 1);
      items.splice(targetIndex, 0, draggedItemObj);
      
      return items;
    });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
      </div>

      {/* Oturum Süresi Ayarları - En üstte */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">⏰ Oturum Süresi Ayarları</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">
              Oturum Süresi (dakika):
            </label>
            <select
              value={sessionDuration}
              onChange={(e) => setSessionDuration(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5 dakika</option>
              <option value={10}>10 dakika</option>
              <option value={15}>15 dakika</option>
              <option value={30}>30 dakika</option>
              <option value={60}>1 saat</option>
              <option value={120}>2 saat</option>
              <option value={240}>4 saat</option>
              <option value={480}>8 saat</option>
            </select>
            <button
              onClick={saveSessionDuration}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              <Save className="h-4 w-4" />
              Kaydet
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Oturum süresi dolduğunda otomatik olarak çıkış yapılır. Kullanıcı aktivitesi süreyi sıfırlar.
          </p>
          {sessionMsg && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-600">{sessionMsg}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Logo Yükleme */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Logo Yükle</h2>
        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={useExistingLogo}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Mevcut Logo Kullan
            </button>
            <span className="text-sm text-gray-500 self-center">veya</span>
            <label className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors cursor-pointer">
              <Upload className="h-4 w-4" />
              Yeni Logo Yükle
              <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </label>
          </div>
          
          {logo && (
            <div className="flex items-center space-x-4">
              <img src={logo} alt="Logo Önizleme" className="h-16 w-16 rounded shadow border" />
              <span className="text-xs text-gray-500">Yüklü Logo</span>
              <button
                onClick={handleClearLogo}
                className="flex items-center gap-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
              >
                <Trash2 className="h-4 w-4" />
                Temizle
              </button>
            </div>
          )}
          {uploadMsg && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-600">{uploadMsg}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Menü Sırası */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Menü Sırası</h2>
          <div className="flex gap-2">
            <button
              onClick={saveMenuOrder}
              className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
            >
              <Save className="h-4 w-4" />
              Kaydet
            </button>
            <button
              onClick={resetMenuOrder}
              className="flex items-center gap-2 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
            >
              <RotateCcw className="h-4 w-4" />
              Sıfırla
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-4">
            Menü öğelerini sürükleyip bırakarak sırasını değiştirebilir, etkinleştirebilir veya devre dışı bırakabilirsiniz.
          </p>
          
          <div className="space-y-2">
            {menuItems.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, item.id)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 bg-white border rounded-lg cursor-move hover:shadow-md transition-all ${
                  draggedItem === item.id ? 'opacity-50' : ''
                } ${!item.enabled ? 'opacity-50 bg-gray-50' : ''}`}
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
                <span className="text-lg">{item.icon}</span>
                <span className={`flex-1 ${!item.enabled ? 'line-through text-gray-500' : ''}`}>
                  {item.label}
                </span>
                <button
                  onClick={() => toggleMenuItem(item.id)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    item.enabled
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  {item.enabled ? 'Aktif' : 'Pasif'}
                </button>
              </div>
            ))}
          </div>
          
          {menuMsg && (
            <div className="flex items-center gap-2 text-sm mt-4">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-600">{menuMsg}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
} 