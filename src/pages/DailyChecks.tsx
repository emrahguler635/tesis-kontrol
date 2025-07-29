import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Plus, Edit, Trash2, Calendar, User, Building, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { apiService, ControlItem, Facility } from '../services/api';

const DailyChecks: React.FC = () => {
  const [items, setItems] = useState<ControlItem[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    workDone: '',
    plannedDate: '',
    completedDate: '',
    description: '',
    user: '',
    facilityId: '',
    status: ''
  });
  const [editIndex, setEditIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const data = await apiService.getControlItems({ period: 'Günlük' });
        setItems(data);
        const facilitiesData = await apiService.getFacilities();
        setFacilities(facilitiesData);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handleEdit = (index: number) => {
    const item = items[index];
    setFormData({
      title: item.title,
      workDone: item.work_done || '',
      plannedDate: '',
      completedDate: item.date,
      description: item.description || '',
      user: item.user || '',
      facilityId: item.facility_id?.toString() || '',
      status: item.status || ''
    });
    setEditIndex(index);
    setModalOpen(true);
  };

  const handleDelete = async (index: number) => {
    if (window.confirm('Bu işi silmek istediğinize emin misiniz?')) {
      const item = items[index];
      await apiService.deleteControlItem(item.id);
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newItem = {
      title: formData.title,
      description: formData.description,
      period: 'Günlük' as const,
      date: formData.completedDate || new Date().toISOString().split('T')[0],
      facilityId: formData.facilityId,
      workDone: formData.workDone,
      user: formData.user,
      status: formData.status
    };
    if (editIndex !== null) {
      const updated = await apiService.updateControlItem(items[editIndex].id, newItem);
      const newItems = [...items];
      newItems[editIndex] = updated;
      setItems(newItems);
      setEditIndex(null);
    } else {
      const saved = await apiService.createControlItem(newItem);
      setItems([...items, saved]);
    }
    setFormData({
      title: '',
      workDone: '',
      plannedDate: '',
      completedDate: '',
      description: '',
      user: '',
      facilityId: '',
      status: ''
    });
    setModalOpen(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Tamamlandı':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Beklemede':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'Yapılmadı':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Tamamlandı':
        return 'bg-green-100 text-green-800';
      case 'Beklemede':
        return 'bg-yellow-100 text-yellow-800';
      case 'Yapılmadı':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Günlük İş Programı</h1>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            {items.length} İş
          </span>
        </div>
        <button
          onClick={() => {
            setEditIndex(null);
            setFormData({
              title: '',
              workDone: '',
              plannedDate: '',
              completedDate: '',
              description: '',
              user: '',
              facilityId: '',
              status: ''
            });
            setModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni İş Ekle
        </button>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Yükleniyor...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <Calendar className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz iş eklenmemiş</h3>
            <p className="text-gray-500">İlk işinizi eklemek için "Yeni İş Ekle" butonuna tıklayın.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İş Detayı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Tarih
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Kullanıcı
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      Tesis
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.title}</div>
                        {item.description && (
                          <div className="text-sm text-gray-500 mt-1">{item.description}</div>
                        )}
                        {item.work_done && (
                          <div className="text-sm text-blue-600 mt-1">
                            <span className="font-medium">Yapılan:</span> {item.work_done}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.user || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {facilities.find(f => f.id === item.facility_id)?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status || '')}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status || '')}`}>
                          {item.status || 'Belirsiz'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(idx)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(idx)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editIndex !== null ? 'İş Düzenle' : 'Yeni İş Ekle'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yapılacak İş *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Yapılacak işi girin"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yapılan İş
                </label>
                <input
                  type="text"
                  value={formData.workDone}
                  onChange={e => setFormData({...formData, workDone: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Yapılan işi girin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yapılacak Tarih
                </label>
                <input
                  type="date"
                  value={formData.plannedDate}
                  onChange={e => setFormData({...formData, plannedDate: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yapılan Tarih
                </label>
                <input
                  type="date"
                  value={formData.completedDate}
                  onChange={e => setFormData({...formData, completedDate: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="İş hakkında açıklama girin"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kullanıcı
                </label>
                <input
                  type="text"
                  value={formData.user}
                  onChange={e => setFormData({...formData, user: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Kullanıcı adını girin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tesis *</label>
                <select
                  value={formData.facilityId}
                  onChange={e => setFormData({ ...formData, facilityId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="">Tesis Seçin</option>
                  {facilities.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Durum *</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="">Durum Seçin</option>
                  <option value="Tamamlandı">Tamamlandı</option>
                  <option value="Beklemede">Beklemede</option>
                  <option value="Yapılmadı">Yapılmadı</option>
                </select>
              </div>
              <div className="flex gap-3 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  {editIndex !== null ? 'Güncelle' : 'Kaydet'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyChecks; 