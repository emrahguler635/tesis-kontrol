import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Building, CalendarDays, Clock, CalendarCheck, FileText, MessageCircle, BarChart3, Settings, Monitor, Image as ImageIcon, Users, Database } from 'lucide-react';
import { useAuthStore } from '../store';

interface User {
  _id?: string;
  id?: number;
  username: string;
  email: string;
  role: string;
}

const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const logo = typeof window !== 'undefined' ? localStorage.getItem('appLogo') : null;
  
  const menuItems = [
    { to: '/', label: 'Ana Sayfa', icon: <Home size={20} /> },
    { to: '/tesisler', label: 'Tesisler', icon: <Building size={20} /> },
    { to: '/gunluk', label: 'Günlük İş Programı', icon: <CalendarDays size={20} /> },
    { to: '/haftalik', label: 'Haftalık Yapılan İşler', icon: <Clock size={20} /> },
    { to: '/aylik', label: 'Aylık Yapılan İşler', icon: <CalendarCheck size={20} /> },
    { to: '/yillik', label: 'Yıllık Yapılan İşler', icon: <CalendarCheck size={20} /> },
    { to: '/raporlar', label: 'Raporlar', icon: <BarChart3 size={20} /> },
    { to: '/mesaj-takip', label: 'Mesaj Yönetimi', icon: <MessageCircle size={20} /> },
    { to: '/bagtv', label: 'BağTV', icon: <Monitor size={20} /> },
    { to: '/data-viewer', label: 'Veri Kontrol', icon: <Database size={20} /> },
    { to: '/ayarlar', label: 'Ayarlar', icon: <Settings size={20} /> },
  ];

  // Tüm kullanıcılar için kullanıcı yönetimi linkini ekle
  const allMenuItems = [
    ...menuItems,
    { to: '/user-management', label: 'Kullanıcı Yönetimi', icon: <Users size={20} /> }
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