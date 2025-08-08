import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { CheckCircle, Calendar, User, Building, Clock, Filter } from 'lucide-react';
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
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-40">
                  İş Adı
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-48">
                  Açıklama
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-48">
                  Yapılan İş
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-24">
                  Tarih
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-24">
                  Tamamlanma
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-24">
                  Kullanıcı
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-24">
                  Tesis
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-20">
                  Durum
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
                  <td className="px-2 py-2 text-xs text-gray-900 max-w-40">
                    <div 
                      className="truncate cursor-help hover:text-blue-600 transition-colors" 
                      title={work.title || 'Başlık belirtilmemiş'}
                    >
                      {work.title || 'Başlık belirtilmemiş'}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-xs text-gray-900 max-w-48">
                    <div 
                      className="truncate cursor-help hover:text-blue-600 transition-colors" 
                      title={work.description || '-'}
                    >
                      {work.description || '-'}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-xs text-gray-900 max-w-48">
                    <div 
                      className="truncate cursor-help hover:text-blue-600 transition-colors" 
                      title={work.work_done || '-'}
                    >
                      {work.work_done || '-'}
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
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-purple-500" />
                      <span className="truncate">{work.user_name || work.user || 'Belirtilmemiş'}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                    <div className="flex items-center gap-1">
                      <Building className="h-3 w-3 text-gray-500" />
                      <span className="truncate">{facilities.find(f => f.id === work.facility_id)?.name || 'Belirtilmemiş'}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(work.status || '')}`}>
                      {getStatusText(work.status || '')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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