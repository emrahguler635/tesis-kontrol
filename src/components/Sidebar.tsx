import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Building, CalendarDays, Clock, CalendarCheck, FileText, MessageCircle, BarChart3, Settings, Monitor, Image as ImageIcon, Users, Database, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store';

interface User {
  _id?: string;
  id?: number;
  username: string;
  email: string;
  role: string;
  permissions?: string[];
}

const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const userPermissions = user?.permissions || [];
  
  // Logo'yu state olarak tut
  const [logo, setLogo] = useState(() => {
    // Önce localStorage'dan dene
    const storedLogo = localStorage.getItem('appLogo');
    if (storedLogo) return storedLogo;
    
    // Yoksa sessionStorage'dan dene
    const sessionLogo = sessionStorage.getItem('appLogo');
    if (sessionLogo) return sessionLogo;
    
    // Hiçbiri yoksa varsayılan logo
    return '/logo.svg';
  });
  
  // Logo değişikliklerini dinle
  useEffect(() => {
    const handleLogoChange = (event: CustomEvent) => {
      setLogo(event.detail.logo);
    };

    window.addEventListener('logoChanged', handleLogoChange as EventListener);

    return () => {
      window.removeEventListener('logoChanged', handleLogoChange as EventListener);
    };
  }, []);
  
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

  const [menuItems, setMenuItems] = useState(getMenuItems());
  const [forceUpdate, setForceUpdate] = useState(0);

  // Menü değişikliklerini dinle
  useEffect(() => {
    const handleMenuOrderChange = () => {
      setMenuItems(getMenuItems());
      setForceUpdate(prev => prev + 1); // Force update
    };

    // localStorage değişikliklerini dinle
    window.addEventListener('storage', handleMenuOrderChange);
    
    // Custom event dinle
    window.addEventListener('menuOrderChanged', handleMenuOrderChange);

    // Sayfa yüklendiğinde de güncelle
    handleMenuOrderChange();

    return () => {
      window.removeEventListener('storage', handleMenuOrderChange);
      window.removeEventListener('menuOrderChanged', handleMenuOrderChange);
    };
  }, []);

  // İkon mapping'i
  const getIcon = (icon: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      '🏠': <Home size={20} />,
      '🏢': <Building size={20} />,
      '📅': <CalendarDays size={20} />,
      '⏰': <Clock size={20} />,
      '📊': <BarChart3 size={20} />,
      '💬': <MessageCircle size={20} />,
      '📺': <Monitor size={20} />,
      '🗄️': <Database size={20} />,
      '✅': <CheckCircle size={20} />,
      '👥': <Users size={20} />,
      '⚙️': <Settings size={20} />,
    };
    return iconMap[icon] || <Home size={20} />;
  };

  // Kullanıcının yetkilerine göre menü öğelerini filtrele
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.enabled) return false;
    
    // Admin kullanıcısı için tüm menüleri göster
    if (user?.role === 'admin') return true;
    
    const hasPermission = Array.isArray(userPermissions) && userPermissions.includes(item.label);
    return hasPermission;
  });

  return (
    <aside className="w-64 bg-white h-full shadow-md flex flex-col">
      <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-blue-700 to-blue-400 rounded-b-2xl shadow-md mb-2">
        <div className="bg-white rounded-full shadow-lg p-2 mb-2 flex items-center justify-center">
          <img src={logo} alt="Logo" className="h-14 w-14 object-contain rounded-full" />
        </div>
        <span className="text-white font-bold text-lg tracking-wide drop-shadow text-center select-none">Bağcılar Belediyesi</span>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {filteredMenuItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
              ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`
            }
          >
            {getIcon(item.icon)}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 text-xs text-gray-400">Sistem Aktif<br />Tüm kontroller güncel</div>
    </aside>
  );
};

export default Sidebar; 