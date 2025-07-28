import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import DailyChecks from './pages/DailyChecks';
import { WeeklyChecks } from './pages/WeeklyChecks';
import MonthlyChecks from './pages/MonthlyChecks';
import { YearlyChecks } from './pages/YearlyChecks';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import Messages from './pages/Messages';
import { Login } from './pages/Login';
import { useAuthStore } from './store';
import Facilities from './pages/Facilities';
import BagTV from './pages/BagTV';
import UserManagement from './pages/UserManagement';
import DataViewer from './pages/DataViewer';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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
                  <Route path="/tesisler" element={<Facilities />} />
                  <Route path="/gunluk" element={<DailyChecks />} />
                  <Route path="/haftalik" element={<WeeklyChecks />} />
                  <Route path="/aylik" element={<MonthlyChecks />} />
                  <Route path="/yillik" element={<YearlyChecks />} />
                  <Route path="/raporlar" element={<Reports />} />
                  <Route path="/mesaj-takip" element={<Messages />} />
                  <Route path="/ayarlar" element={<Settings />} />
                  <Route path="/bagtv" element={<BagTV />} />
                  <Route path="/user-management" element={<UserManagement />} />
                  <Route path="/data-viewer" element={<DataViewer />} />
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