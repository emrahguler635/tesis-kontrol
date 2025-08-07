import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Shield, Filter, Calendar, User, Building, Activity, Plus } from 'lucide-react';
import { apiService } from '../services/api';
import { Card } from '../components/Card';
import { useAuthStore } from '../store';

interface ControlItem {
  id: number;
  title?: string;
  description?: string;
  period: string;
  date: string;
  facilityId?: string;
  workDone?: string;
  user?: string;
  status?: string;
  approval_status?: string;
  approved_by?: string;
  approved_at?: string;
}

const Approvals: React.FC = () => {
  const { user } = useAuthStore();
  const [pendingItems, setPendingItems] = useState<ControlItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Kullanıcının admin olup olmadığını kontrol et
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const loadPendingApprovals = async () => {
      try {
        setLoading(true);
        
        // Onay bekleyen işleri yükle
        const pendingItems = await apiService.getPendingApprovals(user?.username);
        
        // Sadece development'ta log
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          console.log('Onay bekleyen işler yüklendi:', pendingItems?.length || 0);
        }
        
        setPendingItems(pendingItems);
      } catch (error) {
        console.error('Onay bekleyen işler yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadPendingApprovals();
    }
  }, [user]);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      
      // Onay bekleyen işleri yükle
      const pendingItems = await apiService.getPendingApprovals(user?.username);
      
      // Sadece development'ta log
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        console.log('Onay bekleyen işler yüklendi:', pendingItems?.length || 0);
      }
      
      setPendingItems(pendingItems);
    } catch (error) {
      console.error('Onay bekleyen işler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!isAdmin) {
      alert('Sadece admin kullanıcıları onay işlemi yapabilir!');
      return;
    }
    
    try {
      await apiService.approveControlItem(id, user?.username || 'admin');
      loadPendingApprovals();
    } catch (error) {
      console.error('Onaylama hatası:', error);
      alert('Onaylama sırasında hata oluştu!');
    }
  };

  const handleReject = async (id: number, reason: string) => {
    if (!isAdmin) {
      alert('Sadece admin kullanıcıları reddetme işlemi yapabilir!');
      return;
    }
    
    try {
      await apiService.rejectControlItem(id, user?.username || 'admin', reason);
      loadPendingApprovals();
    } catch (error) {
      console.error('Reddetme hatası:', error);
      alert('Reddetme sırasında hata oluştu!');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 h-screen overflow-y-auto">
      {/* Modern Başlık */}
      <div className="flex items-center mb-6">
        <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl mr-4">
          <div className="flex items-center justify-center">
            <Shield className="text-white h-6 w-6 mr-2" />
            <Plus className="text-white h-4 w-4" />
          </div>
        </div>
        <div>
          <h1 className="font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent text-2xl">
            Onay Yönetimi
          </h1>
          <p className="text-gray-600 text-sm">Bekleyen onay işlemleri ve yönetimi</p>
        </div>
      </div>

      {/* Admin Durumu */}
      <Card className="mb-6">
        <div className="flex items-center justify-between p-4">
          {!isAdmin && (
            <div className="flex items-center gap-2 text-blue-600">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">Sadece kendi işlerinizi görüyorsunuz</span>
            </div>
          )}
          {isAdmin && (
            <div className="flex items-center gap-2 text-green-600">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">Admin - Tüm işleri onaylayabilirsiniz</span>
            </div>
          )}
        </div>
      </Card>

      {pendingItems.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Onay bekleyen iş bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingItems.map((item) => (
            <Card key={item.id} className="p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.title || 'Başlık belirtilmemiş'}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.approval_status || 'pending')}`}>
                      {item.approval_status === 'pending' ? 'Beklemede' : 
                       item.approval_status === 'approved' ? 'Onaylandı' : 
                       item.approval_status === 'rejected' ? 'Reddedildi' : 'Bilinmiyor'}
                    </span>
                  </div>
                  
                  {item.description && (
                    <p className="text-gray-600 mb-3">{item.description}</p>
                  )}
                  
                  {item.workDone && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium text-blue-800 mb-1">Yapılan İş:</p>
                      <p className="text-sm text-blue-700">{item.workDone}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Tarih: {new Date(item.date).toLocaleDateString('tr-TR')}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Kullanıcı: {item.user || 'Belirtilmemiş'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Periyot: {item.period}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Tesis: {item.facilityId || 'Belirtilmemiş'}</span>
                    </div>
                  </div>
                </div>
                
                {isAdmin && item.approval_status === 'pending' && (
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                      Onayla
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Reddetme sebebi:');
                        if (reason) {
                          handleReject(item.id, reason);
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      <XCircle className="h-4 w-4 inline mr-1" />
                      Reddet
                    </button>
                  </div>
                )}
                
                {!isAdmin && item.approval_status === 'pending' && (
                  <div className="ml-4 flex items-center gap-2 text-yellow-600">
                    <Clock className="h-5 w-5" />
                    <span className="text-sm font-medium">Onay bekliyor</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* İstatistikler */}
      <Card className="mt-6">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Onay İstatistikleri</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingItems.length}</div>
              <div className="text-sm text-gray-600">Bekleyen Onay</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {pendingItems.filter(item => item.approval_status === 'approved').length}
              </div>
              <div className="text-sm text-gray-600">Onaylanan</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {pendingItems.filter(item => item.approval_status === 'rejected').length}
              </div>
              <div className="text-sm text-gray-600">Reddedilen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Array.from(new Set(pendingItems.map(item => item.user))).length}
              </div>
              <div className="text-sm text-gray-600">Aktif Kullanıcı</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Approvals; 