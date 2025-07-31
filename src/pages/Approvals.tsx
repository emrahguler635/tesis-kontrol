import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
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

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      console.log('Onay bekleyen isler yukleniyor...');
      console.log('Current user:', user);
      const items = await apiService.getPendingApprovals(user?.username);
      console.log('API\'den gelen veriler:', items);
      console.log('Veri sayisi:', items.length);
      setPendingItems(items);
    } catch (error) {
      console.error('Onay bekleyen isler yuklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await apiService.approveControlItem(id, user?.username || 'admin');
      loadPendingApprovals();
    } catch (error) {
      console.error('Onaylama hatası:', error);
      alert('Onaylama sırasında hata oluştu!');
    }
  };

  const handleReject = async (id: number, reason: string) => {
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
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Onay Yönetimi
            </h1>
            <p className="text-gray-600 mt-1">Bekleyen onaylar ve işlemler</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {pendingItems.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Onay bekleyen iş yok</h3>
              <p className="text-gray-500">Tüm işler onaylanmış durumda.</p>
            </div>
          </Card>
        ) : (
          pendingItems.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(item.approval_status || 'pending')}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.approval_status || 'pending')}`}>
                      {item.approval_status === 'approved' ? 'Onaylandı' : 
                       item.approval_status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{item.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">Periyot:</span>
                      <p className="text-gray-900">{item.period}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Tarih:</span>
                      <p className="text-gray-900">{item.date}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Kullanıcı:</span>
                      <p className="text-gray-900">{item.user || 'Belirtilmemiş'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Durum:</span>
                      <p className="text-gray-900">{item.status}</p>
                    </div>
                  </div>

                  {item.approved_by && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Onaylayan:</span> {item.approved_by}
                        {item.approved_at && (
                          <span className="ml-2">
                            ({new Date(item.approved_at).toLocaleDateString('tr-TR')})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {item.approval_status === 'pending' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Onayla
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Reddetme sebebi:');
                        if (reason) {
                          handleReject(item.id, reason);
                        }
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reddet
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Approvals; 