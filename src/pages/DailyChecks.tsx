import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Plus, Edit, Trash2, Calendar, User, Building, CheckCircle, Clock, AlertCircle, CheckSquare, Square, Activity, Sparkles, TrendingUp, Target, Zap } from 'lucide-react';
import { apiService, ControlItem, Facility } from '../services/api';
import { useAuthStore } from '../store';

const DailyChecks: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [items, setItems] = useState<ControlItem[]>([]);
  const [allDailyItems, setAllDailyItems] = useState<ControlItem[]>([]);
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
        
        // Aktif işleri filtrele (Beklemede ve İşlemde olanlar)
        const activeItems = data.filter(item => 
          item.status === 'Beklemede' || item.status === 'İşlemde'
        );
        
        setItems(activeItems);
        setAllDailyItems(data); // Tüm günlük işleri de setle
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

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'Tamamlandı':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'İşlemde':
        return <Activity className="w-5 h-5 text-violet-500" />;
      case 'Beklemede':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'Yapılmadı':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      default:
        return <Clock className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'Tamamlandı':
        return 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300 shadow-emerald-100';
      case 'İşlemde':
        return 'bg-gradient-to-r from-violet-100 to-violet-200 text-violet-800 border-violet-300 shadow-violet-100';
      case 'Beklemede':
        return 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-amber-300 shadow-amber-100';
      case 'Yapılmadı':
        return 'bg-gradient-to-r from-rose-100 to-rose-200 text-rose-800 border-rose-300 shadow-rose-100';
      default:
        return 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 border-slate-300 shadow-slate-100';
    }
  };

  const getStatusText = (status: string | undefined) => {
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
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Günlük İş Programı Başlığı */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                Günlük İş Programı
              </h1>
              <p className="text-slate-600 mt-1 text-lg">Günlük işlerinizi yönetin ve takip edin</p>
            </div>
          </div>
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
          className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 font-semibold text-lg"
        >
          <Plus className="w-6 h-6" />
          Yeni İş Ekle
        </button>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-blue-100 font-medium">Toplam İş</p>
                <p className="text-4xl font-bold">{allDailyItems.length}</p>
                <div className="flex items-center gap-2 text-blue-200">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Tümü</span>
                </div>
              </div>
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                <Calendar className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-emerald-100 font-medium">Tamamlanan</p>
                <p className="text-4xl font-bold">{allDailyItems.filter(item => item.status === 'Tamamlandı').length}</p>
                <div className="flex items-center gap-2 text-emerald-200">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Başarılı</span>
                </div>
              </div>
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="group relative overflow-hidden bg-gradient-to-br from-violet-500 via-violet-600 to-purple-600 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-violet-100 font-medium">Bekleyen + İşlemde</p>
                <p className="text-4xl font-bold">{allDailyItems.filter(item => item.status === 'Beklemede' || item.status === 'İşlemde').length}</p>
                <div className="flex items-center gap-2 text-violet-200">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm">Aktif</span>
                </div>
              </div>
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                <Activity className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="group relative overflow-hidden bg-gradient-to-br from-rose-500 via-rose-600 to-pink-600 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-rose-100 font-medium">Yapılmayan</p>
                <p className="text-4xl font-bold">{allDailyItems.filter(item => item.status === 'Yapılmadı').length}</p>
                <div className="flex items-center gap-2 text-rose-200">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Dikkat</span>
                </div>
              </div>
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                <AlertCircle className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* İş Listesi */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex items-center justify-center py-12">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-blue-400 opacity-20"></div>
            </div>
            <span className="ml-4 text-slate-600 font-medium">Yükleniyor...</span>
          </div>
        </div>
      ) : allDailyItems.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 h-64 flex items-center justify-center">
          <div className="text-center py-12">
            <div className="relative mb-6">
              <div className="p-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                <Calendar className="w-12 h-12 text-blue-600" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Henüz aktif iş yok</h3>
            <p className="text-slate-600 mb-8 max-w-md">Bekleyen veya işlemde olan işlerinizi görmek için "Yeni İş Ekle" butonuna tıklayın ve günlük işlerinizi yönetmeye başlayın.</p>
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
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 font-semibold"
            >
              İlk İşi Ekle
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          <div className="overflow-auto max-h-[calc(100vh-400px)]">
            <table className="min-w-full divide-y divide-gray-300 border border-gray-300">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-10">
                <tr className="border-b-2 border-gray-400">
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Kayıt No
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    İş Adı
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Yapılan İş
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Tarih
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Tamamlanma
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Kullanıcı
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Tesis
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
                              <tbody className="bg-white/50 divide-y divide-gray-300">
                  {allDailyItems
                    .filter(item => item.status === 'Beklemede' || item.status === 'İşlemde')
                    .sort((a, b) => (b.recordNo || 0) - (a.recordNo || 0))
                    .map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300 group border-b border-gray-300">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-600">
                        {item.recordNo || idx + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-700 transition-colors" title={item.title}>
                          {item.title}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <span className="text-xs text-slate-700">
                          {item.description || 'Açıklama yok'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        {item.work_done ? (
                          <div className="text-sm text-blue-600 truncate font-medium" title={item.work_done}>
                            {item.work_done}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Belirtilmemiş</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      {new Date(item.date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      {item.completion_date ? new Date(item.completion_date).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="truncate block max-w-24 font-medium" title={String(item.user_name || item.user || 'Belirtilmemiş')}>
                        {item.user_name || item.user || 'Belirtilmemiş'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="truncate block max-w-24 font-medium" title={facilities.find(f => f.id === item.facility_id)?.name || 'Belirtilmemiş'}>
                        {facilities.find(f => f.id === item.facility_id)?.name || 'Belirtilmemiş'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(item.status)}
                        <span className={`px-3 py-1.5 text-xs font-bold rounded-full border-2 ${getStatusColor(item.status)} shadow-lg`}>
                          {getStatusText(item.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                      <button onClick={() => handleEdit(idx)} className="text-blue-600 hover:text-blue-800 p-2 rounded-xl hover:bg-blue-100 transition-all duration-300 transform hover:scale-110" title="Düzenle">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(idx)} className="text-rose-600 hover:text-rose-800 p-2 rounded-xl hover:bg-rose-100 transition-all duration-300 transform hover:scale-110" title="Sil">
                        <Trash2 className="w-5 h-5" />
                      </button>
                      {!isAdmin && isUserOwnItem(item) && item.status !== 'Tamamlandı' && (
                        <button onClick={() => handleComplete(idx)} className="text-emerald-600 hover:text-emerald-800 p-2 rounded-xl hover:bg-emerald-100 transition-all duration-300 transform hover:scale-110" title="Tamamla">
                          <CheckSquare className="w-5 h-5" />
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 w-full max-w-2xl shadow-2xl border border-white/50">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {editIndex !== null ? 'İş Düzenle' : 'Yeni İş Ekle'}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-xl hover:bg-slate-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">İş Adı *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border-2 border-slate-200 rounded-2xl px-4 py-4 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                    placeholder="İş adını girin..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Tarih *</label>
                  <input
                    type="date"
                    value={formData.completedDate}
                    onChange={e => setFormData({ ...formData, completedDate: e.target.value })}
                    className="w-full border-2 border-slate-200 rounded-2xl px-4 py-4 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-2xl px-4 py-4 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm resize-none"
                  placeholder="İş açıklaması..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Kullanıcı *</label>
                  <select
                    value={formData.user}
                    onChange={e => setFormData({ ...formData, user: e.target.value })}
                    className="w-full border-2 border-slate-200 rounded-2xl px-4 py-4 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
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
                  <label className="block text-sm font-bold text-slate-700 mb-3">Tesis *</label>
                  <select
                    value={formData.facilityId}
                    onChange={e => setFormData({ ...formData, facilityId: e.target.value })}
                    className="w-full border-2 border-slate-200 rounded-2xl px-4 py-4 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
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
                <label className="block text-sm font-bold text-slate-700 mb-3">Durum *</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-2xl px-4 py-4 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                  required
                >
                  <option value="">Durum Seçin</option>
                  <option value="Tamamlandı">Tamamlandı</option>
                  <option value="İşlemde">İşlemde</option>
                  <option value="Beklemede">Beklemede</option>
                  <option value="Yapılmadı">Yapılmadı</option>
                </select>
              </div>
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 px-6 rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 font-bold text-lg"
                >
                  {editIndex !== null ? 'Güncelle' : 'Kaydet'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-700 py-4 px-6 rounded-2xl hover:bg-slate-200 transition-all duration-300 font-bold text-lg"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/50">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  İşi Tamamla
                </h2>
              </div>
              <button
                onClick={() => setCompleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-xl hover:bg-slate-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Yapılan İş *
                </label>
                <textarea
                  value={formData.workDone}
                  onChange={e => setFormData({...formData, workDone: e.target.value})}
                  className="w-full border-2 border-slate-200 rounded-2xl px-4 py-4 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 bg-white/80 backdrop-blur-sm resize-none"
                  placeholder="Yapılan işi detaylı olarak girin..."
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Tamamlanma Tarihi
                </label>
                <input
                  type="date"
                  value={formData.completionDate}
                  onChange={e => setFormData({...formData, completionDate: e.target.value})}
                  className="w-full border-2 border-slate-200 rounded-2xl px-4 py-4 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 px-6 rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 font-bold text-lg"
                >
                  Tamamla
                </button>
                <button
                  type="button"
                  onClick={() => setCompleteModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-700 py-4 px-6 rounded-2xl hover:bg-slate-200 transition-all duration-300 font-bold text-lg"
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