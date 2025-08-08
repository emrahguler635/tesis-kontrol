import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { CheckCircle, Calendar, User, Building, Clock, Filter, Eye } from 'lucide-react';
import { apiService, ControlItem, Facility } from '../services/api';
import { useAuthStore } from '../store';

interface CompletedWork extends ControlItem {
  approved_by?: string;
  approved_at?: string;
  completion_date?: string;
}

const CompletedWorks: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [completedWorks, setCompletedWorks] = useState<CompletedWork[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [filterFacility, setFilterFacility] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [selectedWork, setSelectedWork] = useState<CompletedWork | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchCompletedWorks = async () => {
      setLoading(true);
      try {
        const [data, facilitiesData] = await Promise.all([
          apiService.getControlItems({ 
            period: 'Günlük',
            user: isAdmin ? undefined : user?.username
          }),
          apiService.getFacilities()
        ]);
        
        // Sadece onaylanmış işleri filtrele
        const completed = data.filter(item => 
          item.approval_status === 'approved' || item.status === 'Tamamlandı'
        );
        
        // Çift kayıtları filtrele - daha güçlü filtreleme
        const seenIds = new Set();
        const uniqueCompleted = completed.filter(item => {
          const itemId = item.id?.toString() || '';
          if (seenIds.has(itemId)) {
            return false;
          }
          seenIds.add(itemId);
          return true;
        });
        
        setCompletedWorks(uniqueCompleted);
        setFacilities(facilitiesData);
      } catch (error) {
        console.error('Tamamlanan işler yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompletedWorks();
  }, [user, isAdmin]);

  const getFilteredWorks = () => {
    let filtered = completedWorks;

    if (filterPeriod !== 'all') {
      filtered = filtered.filter(item => item.period === filterPeriod);
    }

    if (filterFacility !== 'all') {
      filtered = filtered.filter(item => 
        item.facility_id?.toString() === filterFacility
      );
    }

    if (filterUser !== 'all') {
      filtered = filtered.filter(item => 
        item.user_name === filterUser || item.user === filterUser
      );
    }

    return filtered;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Tamamlandı':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Tamamlandı':
        return 'Tamamlandı';
      default:
        return 'Onaylandı';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const handleViewDetails = (work: CompletedWork) => {
    setSelectedWork(work);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedWork(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  const filteredWorks = getFilteredWorks();

  return (
    <div className="h-screen overflow-y-auto p-4 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Yapılan İşler</h1>
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-xs sm:text-sm">Onaylanmış ve tamamlanmış işler</span>
        </div>
      </div>

      {/* Filtreler */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">Filtreler:</span>
          </div>
          
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tüm Periyotlar</option>
            <option value="Günlük">Günlük</option>
            <option value="Haftalık">Haftalık</option>
            <option value="Aylık">Aylık</option>
            <option value="Yıllık">Yıllık</option>
          </select>

          <select
            value={filterFacility}
            onChange={(e) => setFilterFacility(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tüm Tesisler</option>
            {facilities.map(facility => (
              <option key={facility.id} value={facility.id.toString()}>
                {facility.name}
              </option>
            ))}
          </select>

          {isAdmin && (
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tüm Kullanıcılar</option>
              {Array.from(new Set(completedWorks.map(item => item.user_name || item.user))).map(user => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          )}
        </div>
      </Card>

      {filteredWorks.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Henüz tamamlanmış iş bulunmuyor.</p>
        </div>
      ) : (
        <div className="overflow-x-auto max-w-full">
          <table className="w-full bg-white border border-gray-200 rounded-lg shadow-sm text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-16">
                  Kayıt No
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-48">
                  İş Adı
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-24">
                  Tarih
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-24">
                  Tamamlanma
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-20">
                  Durum
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-16">
                  Detay
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWorks.map((work) => (
                <tr key={work.id} className="hover:bg-gray-50">
                  <td className="px-2 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-6 w-6">
                        <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-xs font-medium text-white">{work.id}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-xs text-gray-900 max-w-48">
                    <div 
                      className="truncate cursor-help hover:text-blue-600 transition-colors" 
                      title={work.title || 'Başlık belirtilmemiş'}
                    >
                      {work.title || 'Başlık belirtilmemiş'}
                    </div>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-500" />
                      {formatDate(work.date)}
                    </div>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {work.completion_date ? formatDate(work.completion_date) : '-'}
                    </div>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(work.status || '')}`}>
                      {getStatusText(work.status || '')}
                    </span>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <button
                      onClick={() => handleViewDetails(work)}
                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                      title="Detayları Görüntüle"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detay Modal */}
      {showModal && selectedWork && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">İş Detayları</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Kayıt No</h3>
                  <p className="text-sm text-gray-900">{selectedWork.id}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">İş Adı</h3>
                  <p className="text-sm text-gray-900">{selectedWork.title || 'Başlık belirtilmemiş'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tarih</h3>
                  <p className="text-sm text-gray-900">{formatDate(selectedWork.date)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tamamlanma Tarihi</h3>
                  <p className="text-sm text-gray-900">
                    {selectedWork.completion_date ? formatDate(selectedWork.completion_date) : 'Belirtilmemiş'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Kullanıcı</h3>
                  <p className="text-sm text-gray-900">{selectedWork.user_name || selectedWork.user || 'Belirtilmemiş'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tesis</h3>
                  <p className="text-sm text-gray-900">
                    {facilities.find(f => f.id === selectedWork.facility_id)?.name || 'Belirtilmemiş'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Durum</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedWork.status || '')}`}>
                    {getStatusText(selectedWork.status || '')}
                  </span>
                </div>
              </div>
              
              {selectedWork.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Açıklama</h3>
                  <p className="text-sm text-gray-900 mt-1">{selectedWork.description}</p>
                </div>
              )}
              
              {selectedWork.work_done && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Yapılan İş</h3>
                  <p className="text-sm text-gray-900 mt-1">{selectedWork.work_done}</p>
                </div>
              )}
              
              {selectedWork.approved_by && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Onaylayan</h3>
                  <p className="text-sm text-gray-900">
                    {selectedWork.approved_by}
                    {selectedWork.approved_at && ` (${formatDate(selectedWork.approved_at)})`}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* İstatistikler */}
      <Card className="mt-6">
        <div className="p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">İstatistikler</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{filteredWorks.length}</div>
              <div className="text-xs sm:text-sm text-gray-600">Toplam Tamamlanan İş</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {filteredWorks.filter(w => w.completion_date).length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Bu Ay Tamamlanan</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-purple-600">
                {Array.from(new Set(filteredWorks.map(w => w.user_name || w.user))).length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Aktif Kullanıcı</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CompletedWorks; 