import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { ControlItemModal } from '../components/ControlItemModal';
import { apiService, ControlItem } from '../services/api';
import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar, Copy, User, Building, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store';

interface Facility {
  id: number;
  name: string;
}

export const WeeklyChecks: React.FC = () => {
  const { user } = useAuthStore();
  const [items, setItems] = useState<ControlItem[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ControlItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [copyLoading, setCopyLoading] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filteredItems, setFilteredItems] = useState<ControlItem[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Admin ise tüm işleri, değilse sadece kendi işlerini getir
      const isAdmin = user?.role === 'admin';
      const [weeklyItems, dailyItems, facilities] = await Promise.all([
        apiService.getControlItems({ 
          period: 'Haftalık',
          user: isAdmin ? undefined : user?.username
        }),
        apiService.getControlItems({ 
          period: 'Günlük',
          user: isAdmin ? undefined : user?.username
        }),
        apiService.getFacilities()
      ]);
      
      // Onaylanmış günlük işleri filtrele
      const approvedDailyItems = dailyItems.filter(item => 
        item.approval_status === 'approved' || item.status === 'Tamamlandı'
      );
      
      // Haftalık işler ve onaylanmış günlük işleri birleştir
      const allItems = [...weeklyItems, ...approvedDailyItems];
      
      setItems(allItems);
      setFilteredItems(allItems);
      setFacilities(facilities);
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tarih ve kullanıcı filtresi uygula
  useEffect(() => {
    let filtered = items;

    // Tarih filtresi
    if (filterStartDate || filterEndDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        const start = filterStartDate ? new Date(filterStartDate) : null;
        const end = filterEndDate ? new Date(filterEndDate) : null;

        if (start && end) {
          return itemDate >= start && itemDate <= end;
        } else if (start) {
          return itemDate >= start;
        } else if (end) {
          return itemDate <= end;
        }
        return true;
      });
    }

    // Kullanıcı filtresi
    if (filterUser !== 'all') {
      filtered = filtered.filter(item => 
        item.user_name === filterUser || item.user === filterUser
      );
    }

    setFilteredItems(filtered);
  }, [items, filterStartDate, filterEndDate, filterUser]);

  const handleMoveDailyItems = async () => {
    if (!startDate || !endDate) {
      alert('Lütfen başlangıç ve bitiş tarihlerini seçin!');
      return;
    }

    if (!window.confirm('Seçilen tarih aralığındaki günlük işler haftalık periyota taşınacak ve günlük periyottan silinecektir. Devam etmek istiyor musunuz?')) {
      return;
    }

    try {
      setCopyLoading(true);
      
      const result = await apiService.moveControlItems({
        sourcePeriod: 'Günlük',
        targetPeriod: 'Haftalık',
        startDate,
        endDate
      });

      alert(result.message);
      setCopyModalOpen(false);
      setStartDate('');
      setEndDate('');
      loadData(); // Listeyi yenile
    } catch (error) {
      console.error('Taşıma hatası:', error);
      alert('Taşıma sırasında hata oluştu!');
    } finally {
      setCopyLoading(false);
    }
  };

  const handleEdit = (item: ControlItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu öğeyi silmek istediğinizden emin misiniz?')) {
      try {
        await apiService.deleteControlItem(id);
        loadData();
      } catch (error) {
        console.error('Silme hatası:', error);
        alert('Silme sırasında hata oluştu!');
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleModalSave = async (data: any) => {
    try {
      if (selectedItem) {
        await apiService.updateControlItem(selectedItem._id, data);
      } else {
        await apiService.createControlItem({ ...data, period: 'Haftalık' });
      }
      handleModalClose();
      loadData();
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert('Kaydetme sırasında hata oluştu!');
    }
  };

  const getFacilityName = (facilityId: string) => {
    const facility = facilities.find(f => f._id === facilityId);
    return facility ? facility.name : facilityId;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Tamamlandı': return 'text-green-600';
      case 'Bekliyor': return 'text-yellow-600';
      case 'İptal': return 'text-red-600';
      default: return 'text-gray-600';
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
    <div className="h-full flex flex-col">
      {/* Sabit Başlık */}
      <div className="mb-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Toplam Yapılan İşler
            </h1>
            <p className="text-gray-600 mt-1">Tüm yapılan işlerin takibi ve planlama sistemi</p>
          </div>
        </div>
      </div>

      {/* Sabit Filtreler */}
      <div className="mb-4 flex-shrink-0">
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Başlangıç:</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Bitiş:</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Kullanıcı:</label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">Tüm Kullanıcılar</option>
                {Array.from(new Set(items.map(item => item.user_name || item.user))).map(user => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                setFilterStartDate('');
                setFilterEndDate('');
                setFilterUser('all');
              }}
              className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Filtreyi Temizle
            </button>
          </div>
        </Card>
      </div>

      {/* Kaydırılabilir Tablo Alanı */}
      <div className="flex-1 overflow-hidden">
        <Card className="h-full flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    İş Adı
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    Yapılan İş
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Tarih
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Tamamlanma
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Kullanıcı
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      Tesis
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    Durum
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 truncate" title={item.title}>
                          {item.title}
                        </div>
                        {item.description && (
                          <div className="text-xs text-gray-500 mt-1 truncate" title={item.description}>
                            {item.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        {item.work_done ? (
                          <div className="text-sm text-blue-600 truncate" title={item.work_done}>
                            {item.work_done}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Belirtilmemiş</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(item.date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.completion_date ? new Date(item.completion_date).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="truncate block max-w-24" title={item.user_name || item.user || 'Belirtilmemiş'}>
                        {item.user_name || item.user || 'Belirtilmemiş'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="truncate block max-w-24" title={facilities.find(f => f.id === item.facility_id)?.name || 'Belirtilmemiş'}>
                        {facilities.find(f => f.id === item.facility_id)?.name || 'Belirtilmemiş'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border-green-200">
                          Tamamlandı
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Düzenle"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id.toString())}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Sil"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Sabit Butonlar */}
      <div className="mt-4 flex-shrink-0">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => setCopyModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
          >
            <Copy className="h-5 w-5" />
            <span>Günlük İşleri Taşı</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Yeni Ekle</span>
          </button>
        </div>
      </div>

      {/* Kopyalama Modal */}
      {copyModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Günlük İşleri Taşı
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div className="text-sm text-gray-600">
                Seçilen tarih aralığındaki günlük işler haftalık periyota taşınacak ve günlük periyottan silinecektir.
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setCopyModalOpen(false);
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleMoveDailyItems}
                disabled={copyLoading}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
              >
                {copyLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Taşınıyor...
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Taşı
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Düzenleme Modal */}
      {isModalOpen && (
        <ControlItemModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          item={selectedItem}
          facilities={facilities}
          period="Haftalık" as any
        />
      )}
    </div>
  );
};

export default WeeklyChecks; 