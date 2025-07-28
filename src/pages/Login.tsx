import React, { useState } from 'react';
import { useAuthStore } from '../store';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export function Login() {
  const login = useAuthStore(s => s.login);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Logo ayarlarıyla uyumlu olsun
  const logo = localStorage.getItem('appLogo') || '/vite.svg';

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt with:', { username, password });
    try {
      console.log('Sending request to /api/login...');
      const res = await axios.post('/api/login', { username, password });
      console.log('Login response:', res.data);
      login(res.data); // login fonksiyonuna backend'den dönen kullanıcıyı veriyoruz
      setError('');
    } catch (err) {
      console.error('Login error:', err);
      setError('Kullanıcı adı veya şifre hatalı!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="mb-10 flex flex-col items-center">
        <div className="flex items-center justify-center w-32 h-32 rounded-full bg-white shadow-lg mb-4 border-4 border-blue-100">
          <img src={logo} alt="Bağcılar Belediyesi" className="w-24 h-24 object-contain" />
        </div>
        <div className="text-center select-none">
          <div className="text-2xl md:text-3xl lg:text-4xl font-light text-blue-600 tracking-widest mb-1 animate-fade-in">
            Bağcılar Belediyesi
          </div>
          <div className="text-lg md:text-xl lg:text-2xl font-semibold text-blue-800 tracking-wide mb-1 animate-fade-in delay-100">
            Bilgi İşlem Müdürlüğü
          </div>
          <div className="text-xl md:text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-700 bg-clip-text text-transparent drop-shadow-lg tracking-wider animate-fade-in delay-200">
            İş Takip Programı
          </div>
        </div>
      </div>
      <form className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm space-y-6" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-bold text-center">Giriş Yap</h1>
        {error && <div className="text-red-600 text-center text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium mb-1">Kullanıcı Adı</label>
          <input
            className="input-field"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Şifre</label>
          <input
            type="password"
            className="input-field"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary w-full">Giriş Yap</button>
        <div className="text-xs text-gray-400 text-center">Emrah GÜLER</div>
      </form>
    </div>
  );
} 