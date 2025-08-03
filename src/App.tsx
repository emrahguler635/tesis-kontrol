import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import DailyChecks from './pages/DailyChecks';
import { WeeklyChecks } from './pages/WeeklyChecks';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import Messages from './pages/Messages';
import { Login } from './pages/Login';
import { useAuthStore } from './store';
import Facilities from './pages/Facilities';
import BagTV from './pages/BagTV';
import UserManagement from './pages/UserManagement';
import DataViewer from './pages/DataViewer';
import Approvals from './pages/Approvals';
import CompletedWorks from './pages/CompletedWorks';
import { WhatsAppNotifications } from './pages/WhatsAppNotifications';

// Sayfa yetki kontrolü için mapping
const pagePermissions = {
  '/': 'Ana Sayfa',
  '/facilities': 'Tesisler',
  '/daily-checks': 'Günlük İş Programı',
  '/haftalik': 'Toplam Yapılan İşler',
  '/reports': 'Raporlar',
  '/messages': 'Mesaj Yönetimi',
  '/bagtv': 'BağTV',
  '/data-control': 'Veri Kontrol',
  '/approvals': 'Onay Yönetimi',
  '/completed-works': 'Yapılan İşler',
  '/settings': 'Ayarlar',
  '/user-management': 'Kullanıcı Yönetimi',
  '/whatsapp': 'WhatsApp Bildirimleri'
};

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, checkAuth, checkSessionTimeout } = useAuthStore();
  const location = useLocation();
  
  // Oturum süresi kontrolü
  const isSessionExpired = checkSessionTimeout();
  
  // Oturum kontrolü - daha sıkı kontrol
  const isLoggedIn = isAuthenticated && user !== null && checkAuth() && user.id && user.username && !isSessionExpired;
  
  // Debug için log
  console.log('🔍 PrivateRoute Debug:', {
    isAuthenticated,
    hasUser: user !== null,
    checkAuthResult: checkAuth(),
    hasUserId: user?.id,
    hasUsername: user?.username,
    isLoggedIn,
    isSessionExpired,
    currentPath: location.pathname
  });
  
  if (!isLoggedIn) {
    console.log('🔒 Oturum yok veya süresi dolmuş - Login sayfasına yönlendiriliyor');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Sayfa yetki kontrolü
  const currentPath = location.pathname;
  const requiredPermission = pagePermissions[currentPath];
  
  if (requiredPermission) {
    const userPermissions = user?.permissions || [];
    
    // Admin kullanıcısı için tüm sayfalara erişim
    if (user?.role === 'admin') {
      console.log('✅ Admin erişimi - tüm sayfalar');
      return <>{children}</>;
    }
    
    if (!userPermissions.includes(requiredPermission)) {
      console.log('❌ Yetki yok - ana sayfaya yönlendiriliyor');
      return <Navigate to="/" replace />;
    }
    console.log('✅ Yetki var - sayfa gösteriliyor');
  }

  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="*"
          element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/facilities" element={<Facilities />} />
                  <Route path="/daily-checks" element={<DailyChecks />} />
                  <Route path="/haftalik" element={<WeeklyChecks />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/bagtv" element={<BagTV />} />
                  <Route path="/user-management" element={<UserManagement />} />
                  <Route path="/data-control" element={<DataViewer />} />
                  <Route path="/approvals" element={<Approvals />} />
                  <Route path="/completed-works" element={<CompletedWorks />} />
                  <Route path="/whatsapp" element={<WhatsAppNotifications />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App; 