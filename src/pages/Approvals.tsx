import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Shield } from 'lucide-react';
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Onay Yönetimi</h1>
        {!isAdmin && (
          <div className="flex items-center gap-2 text-blue-600">
            <Shield className="h-5 w-5" />
            <span className="text-sm">Sadece kendi işlerinizi görüyorsunuz</span>
          </div>
        )}
        {isAdmin && (
          <div className="flex items-center gap-2 text-green-600">
            <Shield className="h-5 w-5" />
            <span className="text-sm">Admin - Tüm işleri onaylayabilirsiniz</span>
          </div>
        )}
      </div>

      {pendingItems.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Onay bekleyen iş bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingItems.map((item) => (
            <Card key={item.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.title || 'Başlık belirtilmemiş'}
                  </h3>
                  {item.description && (
                    <p className="text-gray-600 mb-2">{item.description}</p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Periyot:</span> {item.period}
                    </div>
                    <div>
                      <span className="font-medium">Tarih:</span> {item.date}
                    </div>
                    <div>
                      <span className="font-medium">Kullanıcı:</span> {item.user || 'Belirtilmemiş'}
                    </div>
                    <div>
                      <span className="font-medium">Durum:</span>
                      <span className={`ml-1 px-2 py-1 rounded-full text-xs ${getStatusColor(item.approval_status || 'pending')}`}>
                        {item.approval_status === 'pending' ? 'Beklemede' : 
                         item.approval_status === 'approved' ? 'Onaylandı' : 
                         item.approval_status === 'rejected' ? 'Reddedildi' : 'Bilinmiyor'}
                      </span>
                    </div>
                  </div>
                  {item.workDone && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Yapılan İş:</span> {item.workDone}
                      </p>
                    </div>
                  )}
                </div>
                
                {isAdmin && item.approval_status === 'pending' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Reddetme sebebi:');
                        if (reason) {
                          handleReject(item.id, reason);
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Reddet
                    </button>
                  </div>
                )}
                
                {!isAdmin && item.approval_status === 'pending' && (
                  <div className="ml-4 text-sm text-gray-500">
                    <Clock className="h-5 w-5" />
                    <span>Onay bekliyor</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Approvals; 