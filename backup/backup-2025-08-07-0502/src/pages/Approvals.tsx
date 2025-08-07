import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Shield, Filter, Calendar, User, Building, Activity, Plus, Sparkles, TrendingUp, Target, Zap } from 'lucide-react';
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
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Onaylandı';
      case 'rejected':
        return 'Reddedildi';
      case 'pending':
        return 'Beklemede';
      default:
        return 'Bilinmiyor';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center justify-center py-12">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-orange-400 opacity-20"></div>
          </div>
          <span className="ml-4 text-slate-600 font-medium">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 min-h-screen">
      {/* Modern Başlık */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Onay Yönetimi
              </h1>
              <p className="text-slate-600 mt-1 text-lg">Bekleyen onay işlemleri ve yönetimi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Durumu */}
      <Card className="backdrop-blur-sm bg-white/80 border border-white/20 shadow-xl">
        <div className="flex items-center justify-between p-6">
          {!isAdmin && (
            <div className="flex items-center gap-3 text-blue-600">
              <Shield className="h-6 w-6" />
              <span className="text-lg font-medium">Sadece kendi işlerinizi görüyorsunuz</span>
            </div>
          )}
          {isAdmin && (
            <div className="flex items-center gap-3 text-green-600">
              <Shield className="h-6 w-6" />
              <span className="text-lg font-medium">Admin - Tüm işleri onaylayabilirsiniz</span>
            </div>
          )}
        </div>
      </Card>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-orange-100 font-medium">Toplam Onay</p>
                <p className="text-4xl font-bold">{pendingItems.length}</p>
                <div className="flex items-center gap-2 text-orange-200">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Tümü</span>
                </div>
              </div>
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                <Shield className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="group relative overflow-hidden bg-gradient-to-br from-yellow-500 via-yellow-600 to-orange-600 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-yellow-100 font-medium">Bekleyen</p>
                <p className="text-4xl font-bold">{pendingItems.filter(item => item.approval_status === 'pending').length}</p>
                <div className="flex items-center gap-2 text-yellow-200">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Onay Bekliyor</span>
                </div>
              </div>
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                <Clock className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="group relative overflow-hidden bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-green-100 font-medium">Onaylanan</p>
                <p className="text-4xl font-bold">{pendingItems.filter(item => item.approval_status === 'approved').length}</p>
                <div className="flex items-center gap-2 text-green-200">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Başarılı</span>
                </div>
              </div>
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="group relative overflow-hidden bg-gradient-to-br from-red-500 via-red-600 to-pink-600 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-red-100 font-medium">Reddedilen</p>
                <p className="text-4xl font-bold">{pendingItems.filter(item => item.approval_status === 'rejected').length}</p>
                <div className="flex items-center gap-2 text-red-200">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm">Reddedildi</span>
                </div>
              </div>
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                <XCircle className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* İş Listesi */}
      {pendingItems.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 h-64 flex items-center justify-center">
          <div className="text-center py-12">
            <div className="relative mb-6">
              <div className="p-6 bg-gradient-to-r from-orange-100 to-red-100 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                <Shield className="w-12 h-12 text-orange-600" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Onay bekleyen iş yok</h3>
            <p className="text-slate-600 mb-8 max-w-md">Şu anda onay bekleyen iş bulunmuyor. Tüm işler onaylanmış veya reddedilmiş durumda.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="overflow-auto max-h-[calc(100vh-400px)]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Kayıt No
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    İş Adı
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Yapılan İş
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tamamlanma
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tesis
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">{item.id || idx + 1}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.title || 'Başlık belirtilmemiş'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={item.description}>
                        {item.description || 'Açıklama yok'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-blue-600 max-w-xs truncate" title={item.workDone}>
                        {item.workDone || 'Belirtilmemiş'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {new Date(item.date).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {item.approved_at ? new Date(item.approved_at).toLocaleDateString('tr-TR') : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mr-2">
                          <User className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm text-gray-900">
                          {item.user || 'Belirtilmemiş'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {item.facilityId || 'Belirtilmemiş'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.approval_status || 'pending')}`}>
                          {getStatusIcon(item.approval_status || 'pending')}
                          <span className="ml-1">{getStatusText(item.approval_status || 'pending')}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isAdmin && item.approval_status === 'pending' && (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center gap-1"
                            title="Onayla"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Onayla
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Reddetme sebebi:');
                              if (reason) {
                                handleReject(item.id, reason);
                              }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center gap-1"
                            title="Reddet"
                          >
                            <XCircle className="w-3 h-3" />
                            Reddet
                          </button>
                        </div>
                      )}
                      
                      {!isAdmin && item.approval_status === 'pending' && (
                        <div className="flex items-center justify-end text-yellow-600">
                          <Clock className="h-4 w-4 mr-1" />
                          <span className="text-xs">Onay bekliyor</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals; 