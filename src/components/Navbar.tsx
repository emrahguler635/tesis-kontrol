import React, { useState, useEffect } from 'react'
import { Bell, User, Settings, LogOut, ChevronDown, Image as ImageIcon, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'

export function Navbar() {
  const navigate = useNavigate()
  const logout = useAuthStore(s => s.logout)
  const user = useAuthStore(s => s.user)
  const loginTime = useAuthStore(s => s.loginTime)
  const sessionTimeout = useAuthStore(s => s.sessionTimeout)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [remainingTime, setRemainingTime] = useState<string>('')
  const [forceUpdate, setForceUpdate] = useState(0)
  const [logo, setLogo] = useState(() => {
    // Önce localStorage'dan dene
    const storedLogo = localStorage.getItem('appLogo');
    if (storedLogo) return storedLogo;
    
    // Yoksa sessionStorage'dan dene
    const sessionLogo = sessionStorage.getItem('appLogo');
    if (sessionLogo) return sessionLogo;
    
    // Hiçbiri yoksa varsayılan logo
    return '/logo.svg';
  })

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

  // Force update için
  useEffect(() => {
    const interval = setInterval(() => {
      setForceUpdate(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Kalan oturum süresini hesapla
  useEffect(() => {
    const updateRemainingTime = () => {
      if (!loginTime) return;
      
      // Session timeout değerini dinamik olarak al
      const currentSessionTimeout = (() => {
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('sessionDuration');
          if (saved) {
            return parseInt(saved) * 60 * 1000;
          }
        }
        return 30 * 60 * 1000;
      })();
      
      const currentTime = Date.now();
      const timeDiff = currentTime - loginTime;
      const remaining = currentSessionTimeout - timeDiff;
      
      if (remaining <= 0) {
        setRemainingTime('Oturum süresi doldu');
        return;
      }
      
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setRemainingTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(interval);
  }, [loginTime]);

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-1 flex items-center justify-start space-x-3">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-full p-1 flex items-center justify-center">
                <img src={logo} alt="Logo" className="h-10 w-16 object-contain rounded-full" />
              </div>
              <h1
                className="text-xl md:text-2xl lg:text-3xl font-extrabold text-white tracking-wider drop-shadow-lg font-sans whitespace-pre-line text-left cursor-pointer select-none max-w-full break-words overflow-hidden"
                style={{lineHeight: '1.2', maxWidth: '100%', wordBreak: 'break-word'}}
                onClick={() => navigate('/')}
              >
                Tesis Kontrol Sistemi
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Oturum Süresi */}
            {loginTime && (
              <div className="flex items-center space-x-2 text-white text-sm">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Oturum: {remainingTime}</span>
              </div>
            )}
            
            {/* Bildirim */}
            <div className="relative">
              <button 
                className="p-2 text-white hover:text-blue-100 hover:bg-white/10 rounded-lg transition-all duration-200 relative" 
                onClick={() => setNotifOpen(v => !v)}
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50 animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Bildirimler</h3>
                    <button 
                      className="text-gray-400 hover:text-gray-600"
                      onClick={() => setNotifOpen(false)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-gray-600 text-sm">Henüz bildirim yok.</div>
                </div>
              )}
            </div>
            
            {/* Ayarlar */}
            <button 
              className="p-2 text-white hover:text-blue-100 hover:bg-white/10 rounded-lg transition-all duration-200" 
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-5 w-5" />
            </button>
            
            {/* Kullanıcı */}
            <div className="relative">
              <button 
                className="flex items-center space-x-2 text-white hover:text-blue-100 hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200" 
                onClick={() => setUserMenuOpen(v => !v)}
              >
                <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <span className="font-medium">{user?.username || user?.email || 'Kullanıcı'}</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 animate-in slide-in-from-top-2">
                  <div className="py-2">
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                      onClick={() => { logout(); navigate('/login'); setUserMenuOpen(false); }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
} 