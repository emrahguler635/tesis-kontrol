import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Plus, Edit, Trash2, Calendar, User, Building, CheckCircle, Clock, AlertCircle, CheckSquare, Square, Activity } from 'lucide-react';
import { apiService, ControlItem, Facility } from '../services/api';
import { useAuthStore } from '../store';

const DailyChecks: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [items, setItems] = useState<ControlItem[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [users, setUsers] = useState<Array<{id: number, username: string, role: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    workDone: '',
    plannedDate: '',
    completedDate: '',
    completionDate: '',
    description: '',
    user: user?.username || '',
    facilityId: '',
    status: ''
  });
  const [editIndex, setEditIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        // Admin ise tüm işleri, değilse sadece kendi işlerini getir
        const isAdmin = user?.role === 'admin';
        const [data, facilitiesData, usersData] = await Promise.all([
          apiService.getControlItems({ 
            period: 'Günlük',
            user: isAdmin ? undefined : user?.username
          }),
          apiService.getFacilities(),
          apiService.getUsers()
        ]);
        
        // Onaylanmış/tamamlanmış işleri filtrele (bunlar "Toplam Yapılan İşler"de görünecek)
        const activeItems = data.filter(item => 
          item.approval_status !== 'approved' && item.status !== 'Tamamlandı'
        );
        
        setItems(activeItems);
        setFacilities(facilitiesData);
        setUsers(usersData);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [user]);

  const handleEdit = (index: number) => {
    const item = items[index];
    setFormData({
      title: item.title,
      workDone: item.work_done || '',
      plannedDate: '',
      completedDate: item.date,
      completionDate: item.completion_date || '',
      description: item.description || '',
      user: item.user_name || item.user || '',
      facilityId: item.facility_id?.toString() || '',
      status: item.status || ''
    });
    setEditIndex(index);
    setModalOpen(true);
  };

  const handleDelete = async (index: number) => {
    if (window.confirm('Bu işi silmek istediğinize emin misiniz?')) {
      try {
        const item = items[index];
        console.log('Deleting control item:', item.id);
        await apiService.deleteControlItem(item.id);
        console.log('Control item deleted successfully');
        // State'i güncelle
        setItems(prevItems => prevItems.filter((_, i) => i !== index));
      } catch (error) {
        console.error('Delete error:', error);
        alert('Silme işlemi başarısız oldu. Lütfen tekrar deneyin.');
      }
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
      status: formData.status,
      ...(formData.completionDate && { completionDate: formData.completionDate })
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
      completionDate: '',
      description: '',
      user: user?.username || '',
      facilityId: '',
      status: ''
    });
    setModalOpen(false);
    setCompleteModalOpen(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Tamamlandı':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'İşlemde':
        return <Activity className="w-5 h-5 text-purple-500" />;
      case 'Beklemede':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'Yapılmadı':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Tamamlandı':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'İşlemde':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Beklemede':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Yapılmadı':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Tamamlandı':
        return 'Tamamlandı';
      case 'İşlemde':
        return 'İşlemde';
      case 'Beklemede':
        return 'Beklemede';
      case 'Yapılmadı':
        return 'Yapılmadı';
      default:
        return 'Belirsiz';
    }
  };

  // Kullanıcının kendi işi mi kontrol et
  const isUserOwnItem = (item: ControlItem) => {
    return item.user_name === user?.username || item.user === user?.username;
  };

  // İşi tamamla modal'ını aç
  const handleComplete = (index: number) => {
    const item = items[index];
    const today = new Date().toISOString().split('T')[0];
    
    setFormData({
      title: item.title,
      workDone: item.work_done || '',
      plannedDate: item.date,
      completedDate: item.date,
      completionDate: today,
      description: item.description || '',
      user: item.user_name || item.user || '',
      facilityId: item.facility_id?.toString() || '',
      status: 'Tamamlandı'
    });
    setEditIndex(index);
    setCompleteModalOpen(true); // Yeni modal için
  };

  return (
    <div className="space-y-6">
      {/* Günlük İş Programı Başlığı */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Günlük İş Programı</h1>
          <p className="text-gray-600 mt-1">Günlük işlerinizi yönetin ve takip edin</p>
        </div>
        <button
          onClick={() => {
            setEditIndex(null);
            const today = new Date().toISOString().split('T')[0];
            const formDataWithUser = {
              title: '',
              workDone: '',
              plannedDate: today,
              completedDate: today,
              completionDate: '',
              description: '',
              user: user?.username || '',
              facilityId: '',
              status: ''
            };
            setFormData(formDataWithUser);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Yeni İş Ekle
        </button>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam İş</p>
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tamamlanan</p>
              <p className="text-2xl font-bold text-green-600">
                {items.filter(item => item.status === 'Tamamlandı').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bekleyen</p>
              <p className="text-2xl font-bold text-yellow-600">
                {items.filter(item => item.status === 'Beklemede').length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Yapılmayan</p>
              <p className="text-2xl font-bold text-red-600">
                {items.filter(item => item.status === 'Yapılmadı').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* İş Listesi */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Yükleniyor...</span>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-64 flex items-center justify-center">
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Calendar className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz iş eklenmemiş</h3>
            <p className="text-gray-500 mb-6">İlk işinizi eklemek için "Yeni İş Ekle" butonuna tıklayın.</p>
            <button
              onClick={() => {
                setEditIndex(null);
                const today = new Date().toISOString().split('T')[0];
                const formDataWithUser = {
                  title: '',
                  workDone: '',
                  plannedDate: today,
                  completedDate: today,
                  completionDate: '',
                  description: '',
                  user: user?.username || '',
                  facilityId: '',
                  status: ''
                };
                setFormData(formDataWithUser);
                setModalOpen(true);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              İlk İşi Ekle
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-auto max-h-[calc(100vh-400px)]">
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
                {items.map((item, idx) => (
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
                        {getStatusIcon(item.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                          {getStatusText(item.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium space-x-2">
                      <button onClick={() => handleEdit(idx)} className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors" title="Düzenle">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(idx)} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors" title="Sil">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {!isAdmin && isUserOwnItem(item) && item.status !== 'Tamamlandı' && (
                        <button onClick={() => handleComplete(idx)} className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors" title="Tamamla">
                          <CheckSquare className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">İş Adı *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="İş adını girin..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tarih *</label>
                  <input
                    type="date"
                    value={formData.completedDate}
                    onChange={e => setFormData({ ...formData, completedDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="İş açıklaması..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kullanıcı *</label>
                  <select
                    value={formData.user}
                    onChange={e => setFormData({ ...formData, user: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value="">Kullanıcı Seçin</option>
                    {users.map(user => (
                      <option key={user.id} value={user.username}>
                        {user.username}
                      </option>
                    ))}
                  </select>
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
                    {facilities.map(facility => (
                      <option key={facility.id} value={facility.id}>
                        {facility.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                  <option value="İşlemde">İşlemde</option>
                  <option value="Beklemede">Beklemede</option>
                  <option value="Yapılmadı">Yapılmadı</option>
                </select>
              </div>
              <div className="flex gap-3 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
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

      {/* Basit Tamamlama Modal */}
      {completeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                İşi Tamamla
              </h2>
              <button
                onClick={() => setCompleteModalOpen(false)}
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
                  Yapılan İş *
                </label>
                <textarea
                  value={formData.workDone}
                  onChange={e => setFormData({...formData, workDone: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="Yapılan işi detaylı olarak girin..."
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tamamlanma Tarihi
                </label>
                <input
                  type="date"
                  value={formData.completionDate}
                  onChange={e => setFormData({...formData, completionDate: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Tamamla
                </button>
                <button
                  type="button"
                  onClick={() => setCompleteModalOpen(false)}
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