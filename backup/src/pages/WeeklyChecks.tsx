import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { ControlItemModal } from '../components/ControlItemModal';
import { apiService, ControlItem } from '../services/api';
import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar, Copy, User, Building, CheckCircle, Clock, AlertCircle, CheckSquare, Square, Activity, Sparkles, TrendingUp, Target, Zap, Plus, Edit, Trash2 } from 'lucide-react';
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
      alert('Lütfen başlangıç ve bitiş tarihlerini seçin.');
      return;
    }

    setCopyLoading(true);
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Seçilen tarih aralığındaki günlük işleri bul
      const dailyItems = await apiService.getControlItems({ 
        period: 'Günlük',
        user: user?.role === 'admin' ? undefined : user?.username
      });
      
      const itemsInRange = dailyItems.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= start && itemDate <= end && 
               (item.approval_status === 'approved' || item.status === 'Tamamlandı');
      });

      // Haftalık işlere kopyala
      for (const item of itemsInRange) {
        const weeklyItem = {
          ...item,
          id: `weekly_${Date.now()}_${Math.random()}`,
          period: 'Haftalık' as const,
          date: format(new Date(), 'yyyy-MM-dd'),
          original_daily_id: item.id
        };
        
        await apiService.createControlItem(weeklyItem);
      }

      alert(`${itemsInRange.length} iş haftalık programa kopyalandı.`);
      loadData(); // Verileri yeniden yükle
    } catch (error) {
      console.error('Kopyalama hatası:', error);
      alert('Kopyalama işlemi başarısız oldu.');
    } finally {
      setCopyLoading(false);
      setCopyModalOpen(false);
    }
  };

  const handleEdit = (item: ControlItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu işi silmek istediğinize emin misiniz?')) {
      try {
        await apiService.deleteControlItem(id);
        setItems(items.filter(item => item.id !== id));
        setFilteredItems(filteredItems.filter(item => item.id !== id));
      } catch (error) {
        console.error('Silme hatası:', error);
        alert('Silme işlemi başarısız oldu.');
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
        await apiService.updateControlItem(selectedItem.id, data);
      } else {
        await apiService.createControlItem(data);
      }
      loadData();
      handleModalClose();
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert('Kaydetme işlemi başarısız oldu.');
    }
  };

  const getFacilityName = (facilityId: string) => {
    const facility = facilities.find(f => f.id.toString() === facilityId);
    return facility?.name || 'Bilinmeyen Tesis';
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'tamamlandı':
        return 'bg-gradient-to-r from-green-500 to-emerald-600';
      case 'beklemede':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 'işlemde':
        return 'bg-gradient-to-r from-blue-500 to-indigo-600';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'tamamlandı':
        return <CheckCircle className="h-4 w-4" />;
      case 'beklemede':
        return <Clock className="h-4 w-4" />;
      case 'işlemde':
        return <Activity className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'tamamlandı':
        return 'Tamamlandı';
      case 'beklemede':
        return 'Beklemede';
      case 'işlemde':
        return 'İşlemde';
      default:
        return 'Bilinmiyor';
    }
  };

  // İstatistikler
  const totalItems = filteredItems.length;
  const completedItems = filteredItems.filter(item => 
    item.status?.toLowerCase() === 'tamamlandı'
  ).length;
  const pendingItems = filteredItems.filter(item => 
    item.status?.toLowerCase() === 'beklemede'
  ).length;
  const inProgressItems = filteredItems.filter(item => 
    item.status?.toLowerCase() === 'işlemde'
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-full mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Toplam Yapılan İşler
            </h1>
            <p className="text-gray-600 mt-1">Haftalık iş programı ve tamamlanan işlerin genel görünümü</p>
          </div>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">Toplam İş</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">Tamamlanan</p>
                <p className="text-2xl font-bold">{completedItems}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">Bekleyen</p>
                <p className="text-2xl font-bold">{pendingItems}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">İşlemde</p>
                <p className="text-2xl font-bold">{inProgressItems}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filtreler ve Kontroller */}
        <Card className="backdrop-blur-sm bg-white/80 border border-white/20 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Başlangıç Tarihi</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bitiş Tarihi</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kullanıcı</label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Tüm Kullanıcılar</option>
                {Array.from(new Set(items.map(item => item.user_name || item.user))).map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setCopyModalOpen(true)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Günlük İşleri Kopyala
              </button>
            </div>
          </div>
        </Card>

        {/* İş Listesi - Sadece bu kısım kaydırılabilir */}
        <Card className="backdrop-blur-sm bg-white/80 border border-white/20 shadow-xl h-[calc(100vh-400px)] flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white/90 backdrop-blur-sm z-10">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Kayıt No</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">İş Adı</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Açıklama</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Yapılan İş</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Tarih</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Tamamlanma</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Kullanıcı</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Tesis</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Durum</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems
                  .sort((a, b) => (b.recordNo || 0) - (a.recordNo || 0))
                  .map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-200">
                    <td className="py-4 px-6">
                      <div className="text-sm font-bold text-gray-600">
                        {item.recordNo || index + 1}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-gray-900">{item.title}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="max-w-xs">
                        <span className="text-gray-700 text-sm">
                          {item.description || 'Açıklama yok'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-blue-600 font-medium">{item.work_done || 'Belirtilmemiş'}</span>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {format(new Date(item.date), 'dd.MM.yyyy', { locale: tr })}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {item.completion_date ? format(new Date(item.completion_date), 'dd.MM.yyyy', { locale: tr }) : '-'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{item.user_name || item.user}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{getFacilityName(item.facility_id?.toString() || '')}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        {getStatusText(item.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Modallar */}
      {isModalOpen && selectedItem && (
        <ControlItemModal
          open={isModalOpen}
          onClose={handleModalClose}
          initialData={selectedItem}
          period="weekly"
        />
      )}

      {/* Kopyalama Modal */}
      {copyModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Günlük İşleri Kopyala</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Başlangıç Tarihi</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bitiş Tarihi</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setCopyModalOpen(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                İptal
              </button>
              <button
                onClick={handleMoveDailyItems}
                disabled={copyLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 disabled:opacity-50"
              >
                {copyLoading ? 'Kopyalanıyor...' : 'Kopyala'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyChecks; 