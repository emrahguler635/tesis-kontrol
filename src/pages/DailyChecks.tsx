import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Plus } from 'lucide-react';
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
      workDone: item.workDone || '',
      plannedDate: '',
      completedDate: item.date,
      description: item.description || '',
      user: item.user || '',
      facilityId: item.facilityId || '',
      status: item.status || ''
    });
    setEditIndex(index);
    setModalOpen(true);
  };

  const handleDelete = async (index: number) => {
    if (window.confirm('Bu işi silmek istediğinize emin misiniz?')) {
      const item = items[index];
      await apiService.deleteControlItem(item._id);
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
      const updated = await apiService.updateControlItem(items[editIndex]._id, newItem);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Günlük İş Programı
            </h1>
            <p className="text-gray-600 mt-1">Günlük iş takibi ve planlama sistemi</p>
          </div>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
        >
          <Plus className="h-5 w-5" />
          Ekle
        </button>
      </div>

      <Card>
        {loading ? (
          <div>Yükleniyor...</div>
        ) : (
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={item._id} className="border-b pb-4 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                    <div className="text-sm text-gray-500 mt-1">
                      <span>Yapılan İş: {item.workDone || '-'}</span>
                      <span className="mx-2">•</span>
                      <span>Tarih: {item.date}</span>
                      <span className="mx-2">•</span>
                      <span>Kullanıcı: {item.user || '-'}</span>
                      <span className="mx-2">•</span>
                      <span>Tesis: {facilities.find(f => f._id === item.facilityId)?.name || '-'}</span>
                      <span className="mx-2">•</span>
                      <span>Durum: {item.status || '-'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <button onClick={() => handleEdit(idx)} className="text-blue-600 hover:underline">Düzenle</button>
                    <button onClick={() => handleDelete(idx)} className="text-red-600 hover:underline">Sil</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Yeni İş Ekle</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yapılacak İş
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yapılan İş
                </label>
                <input
                  type="text"
                  value={formData.workDone}
                  onChange={e => setFormData({...formData, workDone: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yapılacak Tarih
                </label>
                <input
                  type="date"
                  value={formData.plannedDate}
                  onChange={e => setFormData({...formData, plannedDate: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yapılan Tarih
                </label>
                <input
                  type="date"
                  value={formData.completedDate}
                  onChange={e => setFormData({...formData, completedDate: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kullanıcı
                </label>
                <input
                  type="text"
                  value={formData.user}
                  onChange={e => setFormData({...formData, user: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tesis</label>
                <select
                  value={formData.facilityId}
                  onChange={e => setFormData({ ...formData, facilityId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Tesis Seçin</option>
                  {facilities.map(f => (
                    <option key={f._id} value={f._id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Seçiniz</option>
                  <option value="Tamamlandı">Tamamlandı</option>
                  <option value="Beklemede">Beklemede</option>
                  <option value="Yapılmadı">Yapılmadı</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                >
                  Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
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