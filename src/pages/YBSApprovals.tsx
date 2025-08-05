import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { apiService } from '../services/api';
import { useAuthStore } from '../store';
import { 
  CheckCircle, Clock, AlertCircle, Check, X, Eye, FileText, 
  User, Calendar, Building, Activity, TrendingUp
} from 'lucide-react';

interface YBSWorkItem {
  id?: number;
  title: string;
  description: string;
  requestDate: string;
  completionDate?: string;
  requestingDepartment: string;
  responsibleUsers: string[];
  jiraNumber?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

const YBSApprovals: React.FC = () => {
  const { user } = useAuthStore();
  const [items, setItems] = useState<YBSWorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<YBSWorkItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const ybsItems = await apiService.getYBSWorkItems();
      
      // Sadece "Tamamlandı" durumundaki işleri filtrele
      const completedItems = (ybsItems || []).filter(item => 
        item.status === 'completed' && item.approvalStatus === 'pending'
      ).map(item => ({
        ...item,
        responsibleUsers: item.responsibleUsers || []
      }));
      
      setItems(completedItems);
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
      setError(error instanceof Error ? error.message : 'Veri yüklenirken hata oluştu');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approved: boolean) => {
    if (!selectedItem) return;
    
    try {
      await apiService.updateYBSWorkItemApproval(selectedItem.id!, {
        approvalStatus: approved ? 'approved' : 'rejected',
        approvedBy: user?.username || '',
        approvedAt: new Date().toISOString()
      });
      
      setApprovalModalOpen(false);
      setSelectedItem(null);
      loadData(); // Listeyi yenile
    } catch (error) {
      console.error('Onay hatası:', error);
      alert('Onay işlemi başarısız oldu!');
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getApprovalStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Onaylandı';
      case 'rejected': return 'Reddedildi';
      case 'pending': return 'Onay Bekliyor';
      default: return 'Bilinmiyor';
    }
  };

  // İstatistikler
  const totalPendingApprovals = items.length;
  const approvedToday = items.filter(item => 
    item.approvalStatus === 'approved' && 
    item.approvedAt && 
    new Date(item.approvedAt).toDateString() === new Date().toDateString()
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-600 text-xl font-semibold mb-4">Hata Oluştu</div>
              <div className="text-gray-600 mb-4">{error}</div>
              <button 
                onClick={() => {
                  setError(null);
                  loadData();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Tekrar Dene
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 min-h-screen">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
                YBS Onay Ekranı
              </h1>
              <p className="text-slate-600 mt-1 text-lg">Tamamlanan işleri onaylayın veya reddedin</p>
            </div>
          </div>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 font-medium">Onay Bekleyen</p>
              <p className="text-3xl font-bold">{totalPendingApprovals}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 font-medium">Bugün Onaylanan</p>
              <p className="text-3xl font-bold">{approvedToday}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 font-medium">Toplam İş</p>
              <p className="text-3xl font-bold">{items.length}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-200" />
          </div>
        </Card>
      </div>

      {/* Onay Bekleyen İşler */}
      <Card className="backdrop-blur-sm bg-white/80 border border-white/20 shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Onay Bekleyen İşler</h2>
            <div className="text-sm text-gray-500">
              {items.length} iş onay bekliyor
            </div>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Onay Bekleyen İş Yok</h3>
              <p className="text-gray-500">Tüm tamamlanan işler onaylanmış durumda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getApprovalStatusColor(item.approvalStatus)}`}>
                          {getApprovalStatusText(item.approvalStatus)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{item.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Talep Eden:</span>
                          <span className="font-medium">{item.requestingDepartment}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Sorumlu:</span>
                          <span className="font-medium">{(item.responsibleUsers || []).join(', ')}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Tamamlanma:</span>
                          <span className="font-medium">{item.completionDate || 'Belirtilmemiş'}</span>
                        </div>
                      </div>
                      
                      {item.jiraNumber && (
                        <div className="mt-3">
                          <span className="text-gray-600 text-sm">JIRA No: </span>
                          <span className="font-medium text-sm">{item.jiraNumber}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setApprovalModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50"
                        title="Detayları Görüntüle"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Onay Modal */}
      {approvalModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">İş Onayı</h2>
              <button
                onClick={() => setApprovalModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedItem.title}</h3>
                <p className="text-gray-600 mt-1">{selectedItem.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Talep Eden:</span>
                  <p className="text-gray-900">{selectedItem.requestingDepartment}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Sorumlu Personel:</span>
                  <p className="text-gray-900">{(selectedItem.responsibleUsers || []).join(', ')}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">JIRA No:</span>
                  <p className="text-gray-900">{selectedItem.jiraNumber || '-'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Tamamlanma Tarihi:</span>
                  <p className="text-gray-900">{selectedItem.completionDate || 'Belirtilmemiş'}</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Bu iş tamamlandı olarak işaretlenmiş. Onaylamak veya reddetmek için aşağıdaki butonları kullanın.
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => handleApproval(false)}
                  className="px-4 py-2 text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <X className="h-4 w-4 inline mr-2" />
                  Reddet
                </button>
                <button
                  onClick={() => handleApproval(true)}
                  className="px-4 py-2 text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Check className="h-4 w-4 inline mr-2" />
                  Onayla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YBSApprovals; 