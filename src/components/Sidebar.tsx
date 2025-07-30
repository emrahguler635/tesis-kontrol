import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Building, CalendarDays, Clock, CalendarCheck, FileText, MessageCircle, BarChart3, Settings, Monitor, Image as ImageIcon, Users, Database, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store';



const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const logo = typeof window !== 'undefined' ? localStorage.getItem('appLogo') : null;
  
  // LocalStorage'dan menü sıralamasını yükle
  const getMenuItems = () => {
    const savedOrder = localStorage.getItem('menuOrder');
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder);
        return parsedOrder.map((item: any) => ({
          to: item.to,
          label: item.label,
          icon: getIconByName(item.label)
        }));
      } catch (error) {
        console.error('Menü sıralaması yüklenirken hata:', error);
      }
    }
    
    // Varsayılan menü öğeleri
    return [
      { to: '/', label: 'Ana Sayfa', icon: <Home size={20} /> },
      { to: '/tesisler', label: 'Tesisler', icon: <Building size={20} /> },
      { to: '/gunluk', label: 'Günlük İş Programı', icon: <CalendarDays size={20} /> },
      { to: '/haftalik', label: 'Haftalık Yapılan İşler', icon: <Clock size={20} /> },
      { to: '/aylik', label: 'Aylık Yapılan İşler', icon: <CalendarCheck size={20} /> },
      { to: '/yillik', label: 'Yıllık Yapılan İşler', icon: <CalendarCheck size={20} /> },
      { to: '/mesaj-takip', label: 'Mesaj Yönetimi', icon: <MessageCircle size={20} /> },
      { to: '/bagtv', label: 'BağTV', icon: <Monitor size={20} /> },
      { to: '/raporlar', label: 'Raporlar', icon: <BarChart3 size={20} /> },
      { to: '/data-viewer', label: 'Veri Kontrol', icon: <Database size={20} /> },
      { to: '/ayarlar', label: 'Ayarlar', icon: <Settings size={20} /> },
    ];
  };

  // Label'a göre ikon döndür
  const getIconByName = (label: string) => {
    switch (label) {
      case 'Ana Sayfa': return <Home size={20} />;
      case 'Tesisler': return <Building size={20} />;
      case 'Günlük İş Programı': return <CalendarDays size={20} />;
      case 'Haftalık Yapılan İşler': return <Clock size={20} />;
      case 'Aylık Yapılan İşler': return <CalendarCheck size={20} />;
      case 'Yıllık Yapılan İşler': return <CalendarCheck size={20} />;
      case 'Mesaj Yönetimi': return <MessageCircle size={20} />;
      case 'BağTV': return <Monitor size={20} />;
      case 'Raporlar': return <BarChart3 size={20} />;
      case 'Veri Kontrol': return <Database size={20} />;
      case 'Ayarlar': return <Settings size={20} />;
      default: return <Home size={20} />;
    }
  };

  const menuItems = getMenuItems();

  // Kullanıcı yetkilerine göre menü öğelerini filtrele
  const filteredMenuItems = menuItems.filter(item => {
    if (!user?.permissions) return true; // Admin kullanıcısı için tüm öğeleri göster
    
    const permissionMap: { [key: string]: string } = {
      '/': 'dashboard',
      '/tesisler': 'facilities',
      '/gunluk': 'dailyChecks',
      '/haftalik': 'weeklyChecks',
      '/aylik': 'monthlyChecks',
      '/yillik': 'yearlyChecks',
      '/mesaj-takip': 'messages',
      '/bagtv': 'bagTV',
      '/raporlar': 'reports',
      '/ayarlar': 'settings',
      '/data-viewer': 'dataControl'
    };
    
    const requiredPermission = permissionMap[item.to];
    return !requiredPermission || user.permissions[requiredPermission as keyof typeof user.permissions];
  });

  // Kullanıcı yönetimi sadece admin veya userManagement yetkisi olan kullanıcılar için
  const showUserManagement = user?.role === 'admin' || user?.permissions?.userManagement;
  
  // Onay sayfası sadece admin için
  const showApprovals = user?.role === 'admin';
  
  // Onay Bekleyen İşler'i Günlük İş Programı altına ekle
  const insertApprovalsAfterGunluk = (items: typeof menuItems) => {
    const result: typeof menuItems = [];
    for (let i = 0; i < items.length; i++) {
      result.push(items[i]);
      // Günlük İş Programı'ndan sonra Onay Bekleyen İşler'i ekle
      if (items[i].to === '/gunluk' && showApprovals) {
        result.push({ to: '/approvals', label: 'Onay Bekleyen İşler', icon: <CheckCircle size={20} /> });
      }
    }
    return result;
  };

  const allMenuItems = [
    ...insertApprovalsAfterGunluk(filteredMenuItems),
    ...(showUserManagement ? [{ to: '/user-management', label: 'Kullanıcı Yönetimi', icon: <Users size={20} /> }] : [])
  ];

  return (
    <aside className="w-64 bg-white h-full shadow-md flex flex-col">
      <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-blue-700 to-blue-400 rounded-b-2xl shadow-md mb-2">
        <div className="bg-white rounded-full shadow-lg p-2 mb-2 flex items-center justify-center">
          {logo ? (
            <img src={logo} alt="Logo" className="h-14 w-14 object-contain rounded-full" />
          ) : (
            <ImageIcon size={48} className="text-blue-400" />
          )}
        </div>
        <span className="text-white font-bold text-lg tracking-wide drop-shadow text-center select-none">Bağcılar Belediyesi</span>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {allMenuItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
              ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 text-xs text-gray-400">Sistem Aktif<br />Tüm kontroller güncel</div>
    </aside>
  );
};

export default Sidebar; 