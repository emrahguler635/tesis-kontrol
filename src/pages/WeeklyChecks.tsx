import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { ControlItemModal } from '../components/ControlItemModal';
import { apiService } from '../services/api';
import { useAuthStore } from '../store';
import { 
  TrendingUp, Target, CheckCircle, Clock, Activity, 
  Edit, Trash2, Copy, Filter, Calendar, User, Search, Building2, Eye
} from 'lucide-react';

interface ControlItem {
  id: number;
  recordNo?: number;
  name?: string;
  title?: string;
  item_name?: string;
  description: string;
  facility_id: string;
  date: string;
  completion_date?: string;
  user: string;
  user_name?: string;
  status?: string;
  approval_status?: string;
  work_done?: string;
}

interface Facility {
  id: number;
  name: string;
}

export const WeeklyChecks: React.FC = () => {
  const { user } = useAuthStore();
  const [items, setItems] = useState<ControlItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ControlItem[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ControlItem | null>(null);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [copyLoading, setCopyLoading] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterUser, setFilterUser] = useState('all');
  const [selectedItem, setSelectedItem] = useState<ControlItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
          period: 'Haftalık'
        };
        await apiService.createControlItem(weeklyItem);
      }

      alert(`${itemsInRange.length} adet günlük iş haftalık işlere kopyalandı.`);
      loadData();
      setCopyModalOpen(false);
    } catch (error) {
      console.error('İşler kopyalanırken hata:', error);
      alert('İşler kopyalanırken bir hata oluştu.');
    } finally {
      setCopyLoading(false);
    }
  };

  const handleEdit = (item: ControlItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu işi silmek istediğinizden emin misiniz?')) {
      try {
        await apiService.deleteControlItem(id);
        loadData();
      } catch (error) {
        console.error('İş silinirken hata:', error);
        alert('İş silinirken bir hata oluştu.');
      }
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleModalSave = async (data: any) => {
    try {
      if (editingItem) {
        await apiService.updateControlItem(editingItem.id.toString(), data);
      } else {
        await apiService.createControlItem(data);
      }
      loadData();
      handleModalClose();
    } catch (error) {
      console.error('Kaydetme hatası:', error);
    }
  };

  const handleViewDetails = (item: ControlItem) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedItem(null);
  };

  const getFacilityName = (facilityId: string) => {
    const facility = facilities.find(f => f.id.toString() === facilityId || f.id === facilityId);
    return facility?.name || 'Bilinmeyen Tesis';
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'tamamlandı':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'beklemede':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'işlemde':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'yapılmadı':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'tamamlandı':
        return '✅';
      case 'beklemede':
        return '⏳';
      case 'işlemde':
        return '🔄';
      case 'yapılmadı':
        return '❌';
      default:
        return '❓';
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
      case 'yapılmadı':
        return 'Yapılmadı';
      default:
        return 'Belirsiz';
    }
  };

  // Responsive tasarım için dinamik sınıflar
  const getResponsiveClasses = () => {
    const { width, height } = screenSize;
    
    // Mobil
    if (width < 768) {
      return {
        container: "min-h-screen flex flex-col",
        header: "flex-shrink-0 p-2",
        title: "text-xl",
        subtitle: "text-sm",
        statsGrid: "grid grid-cols-2 gap-2 mb-2",
        filtersGrid: "grid grid-cols-1 gap-2 p-2",
        tableContainer: "flex-1 overflow-visible",
        table: "w-full"
      };
    }
    
    // Tablet
    if (width < 1024) {
      return {
        container: "min-h-screen flex flex-col",
        header: "flex-shrink-0 p-3",
        title: "text-2xl",
        subtitle: "text-sm",
        statsGrid: "grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3",
        filtersGrid: "grid grid-cols-2 lg:grid-cols-4 gap-3 p-3",
        tableContainer: "flex-1 overflow-visible",
        table: "w-full"
      };
    }
    
    // Desktop
    if (width < 1440) {
      return {
        container: "min-h-screen flex flex-col",
        header: "flex-shrink-0 p-4",
        title: "text-3xl",
        subtitle: "text-base",
        statsGrid: "grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3",
        filtersGrid: "grid grid-cols-2 lg:grid-cols-4 gap-3 p-3",
        tableContainer: "flex-1 overflow-visible",
        table: "w-full"
      };
    }
    
    // Büyük ekranlar
    return {
      container: "min-h-screen flex flex-col",
      header: "flex-shrink-0 p-6",
      title: "text-4xl",
      subtitle: "text-lg",
      statsGrid: "grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4",
      filtersGrid: "grid grid-cols-2 lg:grid-cols-4 gap-4 p-4",
      tableContainer: "flex-1 overflow-visible",
      table: "w-full"
    };
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
      <div className="h-screen overflow-y-auto bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  const classes = getResponsiveClasses();

  return (
    <div className={classes.container}>
      {/* Başlık ve İstatistikler */}
      <div className={classes.header}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className={`font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent ${classes.title}`}>
                Toplam Yapılan İşler
              </h1>
              <p className={`text-gray-600 ${classes.subtitle}`}>Haftalık iş programı ve tamamlanan işlerin genel görünümü</p>
            </div>
          </div>
        </div>

        {/* İstatistik Kartları */}
        <div className={classes.statsGrid}>
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">Toplam İş</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">Tamamlanan</p>
                <p className="text-2xl font-bold">{completedItems}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white p-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">Bekleyen</p>
                <p className="text-2xl font-bold">{pendingItems}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
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
        <Card className="backdrop-blur-sm bg-white/80 border border-white/20 shadow-xl mb-3">
          <div className={classes.filtersGrid}>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Kullanıcı</label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white px-3 py-1 text-sm rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-1"
              >
                <Copy className="h-3 w-3" />
                Günlük İşleri Kopyala
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Tablo Bölümü */}
      <div className={classes.tableContainer}>
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-visible">
          <div className={classes.table}>
            <table className="w-full border border-gray-300">
              <thead className="sticky top-0 bg-white/90 backdrop-blur-sm z-10">
                <tr className="border-b-2 border-gray-400">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    KAYIT NO
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    İŞ ADI
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    TARİH
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    TAMAMLANMA
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    DURUM
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    İŞLEMLER
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems
                  .sort((a, b) => (b.recordNo || b.id) - (a.recordNo || a.id))
                  .map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-6 w-6">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">{item.recordNo || item.id}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 max-w-48 truncate" title={item.name || item.title || item.item_name}>
                        {item.name || item.title || item.item_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                        {new Date(item.date).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <CheckCircle className="h-3 w-3 text-gray-400 mr-1" />
                        {item.completion_date ? new Date(item.completion_date).toLocaleDateString('tr-TR') : '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)} {getStatusText(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Detayları Görüntüle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1 text-green-600 hover:text-green-800 transition-colors"
                          title="Düzenle"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id.toString())}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          title="Sil"
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
        </div>
      </div>

      {/* Modal'lar */}
      <ControlItemModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        item={editingItem}
        facilities={facilities}
        period="Haftalık"
      />

      {/* Kopyalama Modal'ı */}
      {copyModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Günlük İşleri Kopyala</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setCopyModalOpen(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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

      {/* Detay Modal'ı */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">İş Detayları</h2>
              <button
                onClick={closeDetailModal}
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
                  <p className="text-sm text-gray-900">{selectedItem.recordNo || selectedItem.id}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">İş Adı</h3>
                  <p className="text-sm text-gray-900">{selectedItem.name || selectedItem.title || selectedItem.item_name || 'Belirtilmemiş'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tarih</h3>
                  <p className="text-sm text-gray-900">{new Date(selectedItem.date).toLocaleDateString('tr-TR')}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tamamlanma Tarihi</h3>
                  <p className="text-sm text-gray-900">
                    {selectedItem.completion_date ? new Date(selectedItem.completion_date).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Kullanıcı</h3>
                  <p className="text-sm text-gray-900">{selectedItem.user_name || selectedItem.user || 'Belirtilmemiş'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tesis</h3>
                  <p className="text-sm text-gray-900">{getFacilityName(selectedItem.facility_id)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Durum</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedItem.status)}`}>
                    {getStatusIcon(selectedItem.status)} {getStatusText(selectedItem.status)}
                  </span>
                </div>
              </div>
              
              {selectedItem.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Açıklama</h3>
                  <p className="text-sm text-gray-900 mt-1">{selectedItem.description}</p>
                </div>
              )}
              
              {selectedItem.work_done && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Yapılan İş</h3>
                  <p className="text-sm text-gray-900 mt-1">{selectedItem.work_done}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={closeDetailModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyChecks; 