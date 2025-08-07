import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { apiService } from '../services/api';
import { useAuthStore } from '../store';
import { 
  CheckCircle, Clock, AlertCircle, Check, X, Eye, FileText, 
  User, Calendar, Building, Activity, TrendingUp, Search,
  Filter, Download, Plus, Edit, Trash2, MoreHorizontal,
  CheckSquare, XCircle, Clock as ClockIcon, Users, Hash
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<YBSWorkItem[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    const filtered = items.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.requestingDepartment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.responsibleUsers || []).some(user => 
        user.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      (item.jiraNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchTerm, items]);

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
  const totalWorkItems = items.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-full mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-full mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-600 text-xl font-semibold mb-4">Hata Oluştu</div>
              <div className="text-gray-600 mb-4">{error}</div>
              <button 
                onClick={() => {
                  setError(null);
                  loadData();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto space-y-4">
        {/* Modern Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">YBS Onay Ekranı</h1>
                <p className="text-blue-100 mt-1">Tamamlanan işleri onaylayın veya reddedin</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div className="px-3 py-1 bg-white/20 rounded-lg backdrop-blur-sm">
                <span className="text-sm font-medium">Sistem Aktif</span>
              </div>
            </div>
          </div>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-orange-100 font-medium text-sm">Onay Bekleyen</p>
                <p className="text-2xl font-bold">{totalPendingApprovals}</p>
              </div>
              <AlertCircle className="h-6 w-6 text-orange-200" />
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-green-100 font-medium text-sm">Bugün Onaylanan</p>
                <p className="text-2xl font-bold">{approvedToday}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-200" />
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-blue-100 font-medium text-sm">Toplam İş</p>
                <p className="text-2xl font-bold">{totalWorkItems}</p>
              </div>
              <FileText className="h-6 w-6 text-blue-200" />
            </div>
          </Card>
        </div>

        {/* Ana İçerik */}
        <Card className="bg-white shadow-lg border border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Onay Bekleyen İşler</h2>
                  <p className="text-gray-600 text-sm">Onay bekleyen işleri yönetin</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                  <Filter className="w-4 h-4" />
                  Filtrele
                </button>
                <button className="flex items-center gap-2 px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                  <Download className="w-4 h-4" />
                  Dışa Aktar
                </button>
              </div>
            </div>

            {/* Arama */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="İş başlığı, açıklama, talep eden veya JIRA numarası ile arayın..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-10 w-10 text-green-500 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {searchTerm ? 'Arama sonucu bulunamadı' : 'Onay Bekleyen İş Yok'}
                </h3>
                <p className="text-gray-500 text-sm">
                  {searchTerm ? 'Arama kriterlerinize uygun iş bulunamadı.' : 'Tüm tamamlanan işler onaylanmış durumda.'}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            İş Detayları
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            Talep Eden
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Sorumlu Personel
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4" />
                            JIRA No
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Tamamlanma Tarihi
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4" />
                            Durum
                          </div>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.title}</div>
                              <div className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">{item.requestingDepartment}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">
                              {(item.responsibleUsers || []).join(', ')}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">{item.jiraNumber || '-'}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">{item.completionDate || 'Belirtilmemiş'}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getApprovalStatusColor(item.approvalStatus)}`}>
                              {getApprovalStatusText(item.approvalStatus)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedItem(item);
                                  setApprovalModalOpen(true);
                                }}
                                className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Detayları Görüntüle"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Modern Onay Modal */}
      {approvalModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">İş Onayı</h2>
                    <p className="text-blue-100 text-sm">İş detaylarını inceleyin ve onaylayın</p>
                  </div>
                </div>
                <button
                  onClick={() => setApprovalModalOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* İş Başlığı ve Açıklama */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedItem.title}</h3>
                <p className="text-gray-600">{selectedItem.description}</p>
              </div>

              {/* İş Detayları Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Talep Eden:</span>
                  </div>
                  <p className="text-gray-900 font-medium">{selectedItem.requestingDepartment}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Sorumlu Personel:</span>
                  </div>
                  <p className="text-gray-900 font-medium">{(selectedItem.responsibleUsers || []).join(', ')}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">JIRA No:</span>
                  </div>
                  <p className="text-gray-900 font-medium">{selectedItem.jiraNumber || '-'}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Tamamlanma Tarihi:</span>
                  </div>
                  <p className="text-gray-900 font-medium">{selectedItem.completionDate || 'Belirtilmemiş'}</p>
                </div>
              </div>

              {/* Uyarı Kutusu */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 mb-1">Onay Gerekli</h4>
                    <p className="text-sm text-yellow-700">
                      Bu iş tamamlandı olarak işaretlenmiş. Onaylamak veya reddetmek için aşağıdaki butonları kullanın.
                    </p>
                  </div>
                </div>
              </div>

              {/* Onay Butonları */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleApproval(false)}
                  className="flex items-center gap-2 px-6 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors font-medium"
                >
                  <XCircle className="w-5 h-5" />
                  Reddet
                </button>
                <button
                  onClick={() => handleApproval(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg"
                >
                  <CheckCircle className="w-5 h-5" />
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