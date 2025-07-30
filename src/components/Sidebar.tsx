import React from 'react';
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
  const logo = typeof window !== 'undefined' ? localStorage.getItem('appLogo') : null;
  
  // Kullanıcının yetkilerini kontrol et
  const userPermissions = user?.permissions || [];
  
  const allMenuItems = [
    { to: '/', label: 'Ana Sayfa', icon: <Home size={20} />, permission: 'Ana Sayfa' },
    { to: '/tesisler', label: 'Tesisler', icon: <Building size={20} />, permission: 'Tesisler' },
    { to: '/gunluk', label: 'Günlük İş Programı', icon: <CalendarDays size={20} />, permission: 'Günlük İş Programı' },
    { to: '/haftalik', label: 'Toplam Yapılan İşler', icon: <Clock size={20} />, permission: 'Haftalık İşler' },
    { to: '/raporlar', label: 'Raporlar', icon: <BarChart3 size={20} />, permission: 'Raporlar' },
    { to: '/mesaj-takip', label: 'Mesaj Yönetimi', icon: <MessageCircle size={20} />, permission: 'Mesaj Yönetimi' },
    { to: '/bagtv', label: 'BağTV', icon: <Monitor size={20} />, permission: 'BağTV' },
    { to: '/data-viewer', label: 'Veri Kontrol', icon: <Database size={20} />, permission: 'Veri Kontrol' },
    { to: '/ayarlar', label: 'Ayarlar', icon: <Settings size={20} />, permission: 'Ayarlar' },
  ];

  // Kullanıcının yetkilerine göre menü öğelerini filtrele
  const filteredMenuItems = allMenuItems.filter(item => {
    // Admin kullanıcısı tüm menüleri görebilir
    if (user?.role === 'admin') return true;
    
    // Normal kullanıcılar sadece yetkili oldukları menüleri görebilir
    // userPermissions array olup olmadığını kontrol et
    return Array.isArray(userPermissions) && userPermissions.includes(item.permission);
  });

  // Admin kullanıcısı için onay menüsü ekle
  const adminMenuItems = user?.role === 'admin' ? [
    { to: '/approvals', label: 'Onay Yönetimi', icon: <CheckCircle size={20} /> }
  ] : [];

  // Kullanıcı yönetimi linkini ekle (sadece admin görebilir)
  const userManagementItem = user?.role === 'admin' ? [
    { to: '/user-management', label: 'Kullanıcı Yönetimi', icon: <Users size={20} /> }
  ] : [];

  // Final menü öğelerini birleştir
  const finalMenuItems = [
    ...filteredMenuItems,
    ...adminMenuItems,
    ...userManagementItem
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
        {finalMenuItems.map(item => (
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