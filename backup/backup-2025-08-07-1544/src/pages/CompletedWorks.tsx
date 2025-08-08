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
        
        setCompletedWorks(completed);
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
    <div className="h-screen overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Yapılan İşler</h1>
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm">Onaylanmış ve tamamlanmış işler</span>
        </div>
      </div>

      {/* Filtreler */}
      <Card className="mb-6">
        <div className="flex items-center gap-4 p-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtreler:</span>
          </div>
          
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        <div className="grid gap-4">
          {filteredWorks.map((work) => (
            <Card key={work.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {work.title || 'Başlık belirtilmemiş'}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(work.status || '')}`}>
                      {getStatusText(work.status || '')}
                    </span>
                  </div>
                  
                  {work.description && (
                    <p className="text-gray-600 mb-3">{work.description}</p>
                  )}
                  
                  {work.work_done && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium text-green-800 mb-1">Yapılan İş:</p>
                      <p className="text-sm text-green-700">{work.work_done}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Tarih: {formatDate(work.date)}</span>
                    </div>
                    
                    {work.completion_date && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-gray-600">Tamamlanma: {formatDate(work.completion_date)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">
                        Kullanıcı: {work.user_name || work.user || 'Belirtilmemiş'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">
                        Tesis: {facilities.find(f => f.id === work.facility_id)?.name || 'Belirtilmemiş'}
                      </span>
                    </div>
                  </div>

                  {work.approved_by && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>
                          Onaylayan: {work.approved_by} 
                          {work.approved_at && ` (${formatDate(work.approved_at)})`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* İstatistikler */}
      <Card className="mt-6">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">İstatistikler</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{filteredWorks.length}</div>
              <div className="text-sm text-gray-600">Toplam Tamamlanan İş</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredWorks.filter(w => w.completion_date).length}
              </div>
              <div className="text-sm text-gray-600">Bu Ay Tamamlanan</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Array.from(new Set(filteredWorks.map(w => w.user_name || w.user))).length}
              </div>
              <div className="text-sm text-gray-600">Aktif Kullanıcı</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CompletedWorks; 