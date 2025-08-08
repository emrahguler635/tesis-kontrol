import React, { useState, useMemo, useCallback } from 'react';
import { useAuthStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Building2, Image as ImageIcon } from 'lucide-react';
import { apiService } from '../services/api';

export function Login() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Logo'yu doğrudan al
  const logo = '/logo-new.svg';

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const data = await apiService.login({ username, password });

      if (data.success !== false) {
        // Kullanıcı verilerini hazırla - backend'den gelen role'ü kullan
        const userData = {
          id: data.id || data.user?.id || '1',
          username: data.username || data.user?.username || username,
          email: data.email || data.user?.email || `${username}@example.com`,
          role: data.role || data.user?.role || 'user', // Backend'den gelen role'ü kullan
          permissions: data.permissions || data.user?.permissions || ['Ana Sayfa']
        };
        
        // Debug için console log
        console.log('🔍 Login Debug - Frontend:', {
          backendData: data,
          preparedUserData: userData,
          username: username,
          permissionsLength: userData.permissions?.length || 0,
          permissionsArray: userData.permissions || []
        });
        
        // Cache temizleme - localStorage'ı temizle
        localStorage.removeItem('auth');
        sessionStorage.removeItem('auth');
        
        // Tüm cache'i temizle
        localStorage.clear();
        sessionStorage.clear();
        
        // Kullanıcı verilerini store'a kaydet
        useAuthStore.getState().login(userData);
        
        // Başarılı giriş sonrası yönlendirme
        navigate('/dashboard');
        
      } else {
        setError(data.error || data.message || 'Kullanıcı adı veya şifre hatalı!');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Giriş yapılırken bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  }, [username, password, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Fixed Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(/belediye.jpg?v=1.0&cb=1&nocache=1&force=1&refresh=1&cache=1&timestamp=1&version=2.0)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transform: 'translate3d(0,0,0)',
          willChange: 'auto',
          backfaceVisibility: 'hidden',
          perspective: '1000px',
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          width: '100vw',
          height: '100vh',
          backgroundColor: '#f8f9fa'
        }}
      />
      
      {/* Force load image once */}
      <img 
        src={`/belediye.jpg?v=1.0&cb=1&nocache=1&force=1&refresh=1&cache=1&timestamp=1&version=2.0`}
        alt="" 
        style={{ 
          position: 'absolute', 
          top: '-9999px', 
          left: '-9999px',
          width: '1px',
          height: '1px',
          opacity: '0'
        }} 
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20 z-10"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo ve Başlık Bölümü */}
        <div className="text-center mb-8 mt-4">
          <div className="flex items-center justify-center w-48 h-40 rounded-full bg-white shadow-lg mx-auto mb-12 border-4 border-blue-100">
            <img src="/logo.svg" alt="Logo" className="w-44 h-36 object-contain" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-8 drop-shadow-2xl tracking-wider whitespace-nowrap">
            WorkPulse – İş Nabzı
          </h1>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-white drop-shadow-lg tracking-wide">
              Bağcılar Belediyesi
            </p>
            <p className="text-2xl font-bold text-white drop-shadow-lg tracking-wide">
              Bilgi İşlem Müdürlüğü
            </p>
          </div>
        </div>

        {/* Giriş Formu */}
        <div 
          className="bg-white rounded-xl shadow-2xl p-8 border border-gray-100"
          style={{
            transform: 'translate3d(0,0,0)',
            willChange: 'auto',
            backfaceVisibility: 'hidden',
            position: 'relative',
            zIndex: 10
          }}
        >
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            Giriş Yap
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Kullanıcı Adı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Kullanıcı adınızı girin"
                  autoFocus
                  style={{
                    transform: 'translate3d(0,0,0)',
                    willChange: 'auto',
                    backfaceVisibility: 'hidden',
                    position: 'relative',
                    zIndex: 1
                  }}
                />
              </div>
            </div>

            {/* Şifre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Şifrenizi girin"
                  style={{
                    transform: 'translate3d(0,0,0)',
                    willChange: 'auto',
                    backfaceVisibility: 'hidden',
                    position: 'relative',
                    zIndex: 1
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Giriş Butonu */}
            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Giriş yapılıyor...
                </div>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>

          {/* Alt Bilgi */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Geliştirici: Emrah GÜLER
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 