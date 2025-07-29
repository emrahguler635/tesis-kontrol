import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { ControlItemModal } from '../components/ControlItemModal';
import { apiService, ControlItem } from '../services/api';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar, Copy } from 'lucide-react';

interface Facility {
  _id: string;
  name: string;
}

export const MonthlyChecks: React.FC = () => {
  const [items, setItems] = useState<ControlItem[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ControlItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [copyLoading, setCopyLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [items, facilities] = await Promise.all([
        apiService.getControlItems({ period: 'Aylık' }),
        apiService.getFacilities()
      ]);
      setItems(items);
      setFacilities(facilities);
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveWeeklyItems = async () => {
    if (!startDate || !endDate) {
      alert('Lütfen başlangıç ve bitiş tarihlerini seçin!');
      return;
    }

    if (!window.confirm('Seçilen tarih aralığındaki haftalık işler aylık periyota taşınacak ve haftalık periyottan silinecektir. Devam etmek istiyor musunuz?')) {
      return;
    }

    try {
      setCopyLoading(true);
      
      const result = await apiService.moveControlItems({
        sourcePeriod: 'Haftalık',
        targetPeriod: 'Aylık',
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
        await apiService.createControlItem({ ...data, period: 'Aylık' });
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
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Aylık Kontroller
            </h1>
            <p className="text-gray-600 mt-1">Aylık iş takibi ve planlama sistemi</p>
          </div>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Başlık
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tesis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.title}</div>
                    {item.description && (
                      <div className="text-sm text-gray-500">{item.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getFacilityName(item.facilityId || '')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(parseISO(item.date), 'dd.MM.yyyy', { locale: tr })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status || '')}`}>
                      {item.status || 'Bekliyor'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Butonlar - Sayfanın Alt Kısmında */}
      <div className="flex items-center justify-center space-x-4 mt-6">
        <button
          onClick={() => setCopyModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
        >
          <Copy className="h-5 w-5" />
          <span>Haftalık İşleri Taşı</span>
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

      {/* Kopyalama Modal */}
      {copyModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Haftalık İşleri Taşı
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
                Seçilen tarih aralığındaki haftalık işler aylık periyota taşınacak ve haftalık periyottan silinecektir.
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
                onClick={handleMoveWeeklyItems}
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
          period="Aylık" as any
        />
      )}
    </div>
  );
};

export default MonthlyChecks; 