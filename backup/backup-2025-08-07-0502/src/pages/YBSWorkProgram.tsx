import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { apiService } from '../services/api';
import { useAuthStore } from '../store';
import { 
  Plus, Edit, Trash2, Calendar, User, Building, CheckCircle, Clock, AlertCircle, 
  CheckSquare, Square, Activity, Sparkles, TrendingUp, Target, Zap, Users, 
  FileText, Check, X, Eye, Filter, Search, Download, Upload, Hash
} from 'lucide-react';

interface YBSWorkItem {
  id?: number;
  title: string;
  description: string;
  requestDate: string;
  completionDate?: string;
  requestingDepartment: string;
  responsibleUsers: string[];
  jiraNumber?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

interface User {
  id: number;
  username: string;
  role: string;
}

const YBSWorkProgram: React.FC = () => {
  const { user } = useAuthStore();
  const [items, setItems] = useState<YBSWorkItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<YBSWorkItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<YBSWorkItem | null>(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<YBSWorkItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requestDate: new Date().toISOString().split('T')[0],
    completionDate: '',
    requestingDepartment: '',
    responsibleUsers: [] as string[],
    jiraNumber: '',
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'rejected',
    approvalStatus: 'pending' as 'pending' | 'approved' | 'rejected'
  });

  // Filter state
  const [filters, setFilters] = useState({
    status: 'all',
    approvalStatus: 'all',
    department: 'all',
    dateRange: {
      start: '',
      end: ''
    }
  });

  useEffect(() => {
    loadData();
  }, [user]);

    const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [ybsItems, usersData] = await Promise.all([
        apiService.getYBSWorkItems(),
        apiService.getUsers()
      ]);
      
      // Veri güvenliği için responsibleUsers alanını kontrol et
      const safeYbsItems = (ybsItems || []).map(item => ({
        ...item,
        responsibleUsers: item.responsibleUsers || []
      }));
      
      setItems(safeYbsItems);
      setFilteredItems(safeYbsItems);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
      setError(error instanceof Error ? error.message : 'Veri yüklenirken hata oluştu');
      // Hata durumunda boş array'ler set et
      setItems([]);
      setFilteredItems([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validasyonu
    if (!formData.title || !formData.requestingDepartment || !formData.responsibleUsers.length) {
      alert('Lütfen zorunlu alanları doldurun!');
      return;
    }

             try {
      // Boş completionDate'i null yap
      const newItem: YBSWorkItem = {
        ...formData,
        completionDate: formData.completionDate || undefined,
        jiraNumber: formData.jiraNumber || undefined,
        createdBy: user?.username || 'admin',
        createdAt: new Date().toISOString()
      };

      if (editItem) {
        await apiService.updateYBSWorkItem(editItem.id!, newItem);
      } else {
        await apiService.createYBSWorkItem(newItem);
      }

      setModalOpen(false);
      setEditItem(null);
      resetForm();
      await loadData();
      
      alert(editItem ? 'İş başarıyla güncellendi!' : 'İş başarıyla eklendi!');
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert(`Kaydetme işlemi başarısız oldu! Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  };

  const handleEdit = (item: YBSWorkItem) => {
    console.log('Düzenlenecek item:', item);
    setEditItem(item);
    setFormData({
      title: item.title || '',
      description: item.description || '',
      requestDate: item.requestDate || new Date().toISOString().split('T')[0],
      completionDate: item.completionDate || '',
      requestingDepartment: item.requestingDepartment || '',
      responsibleUsers: item.responsibleUsers || [],
      jiraNumber: item.jiraNumber || '',
      status: item.status || 'pending',
      approvalStatus: item.approvalStatus || 'pending'
    });
    console.log('Form verisi yüklendi:', {
      title: item.title || '',
      description: item.description || '',
      requestDate: item.requestDate || new Date().toISOString().split('T')[0],
      completionDate: item.completionDate || '',
      requestingDepartment: item.requestingDepartment || '',
      responsibleUsers: item.responsibleUsers || [],
      jiraNumber: item.jiraNumber || '',
      status: item.status || 'pending',
      approvalStatus: item.approvalStatus || 'pending'
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bu işi silmek istediğinize emin misiniz?')) {
      try {
        await apiService.deleteYBSWorkItem(id);
        loadData();
      } catch (error) {
        console.error('Silme hatası:', error);
        alert('Silme işlemi başarısız oldu!');
      }
    }
  };

  const handleApproval = async (id: number, approved: boolean) => {
    if (!selectedItem) return;
    
    try {
      await apiService.updateYBSWorkItemApproval(id, {
        approvalStatus: approved ? 'approved' : 'rejected',
        approvedBy: user?.username || '',
        approvedAt: new Date().toISOString()
      });
      
      setApprovalModalOpen(false);
      setSelectedItem(null);
      loadData();
    } catch (error) {
      console.error('Onay hatası:', error);
      alert('Onay işlemi başarısız oldu!');
    }
  };

  const addTestData = async () => {
    try {
      const testData = [
        {
          title: 'Sistem Güncellemesi',
          description: 'Ana sistem güncellemesi ve güvenlik yamaları',
          requestDate: '2024-01-15',
          completionDate: '2024-01-20',
          requestingDepartment: 'Bilgi İşlem Müdürlüğü',
          responsibleUsers: ['Ahmet Yılmaz', 'Mehmet Demir'],
          jiraNumber: 'CITYPLUS-2024-001',
          status: 'completed',
          approvalStatus: 'pending',
          createdBy: user?.username || 'admin'
        },
        {
          title: 'Veritabanı Optimizasyonu',
          description: 'Performans iyileştirmesi için veritabanı optimizasyonu',
          requestDate: '2024-01-10',
          completionDate: undefined,
          requestingDepartment: 'Teknoloji Müdürlüğü',
          responsibleUsers: ['Fatma Kaya'],
          jiraNumber: 'CITYPLUS-2024-002',
          status: 'in_progress',
          approvalStatus: 'pending',
          createdBy: user?.username || 'admin'
        },
        {
          title: 'Kullanıcı Eğitimi',
          description: 'Yeni sistem kullanıcı eğitimi programı',
          requestDate: '2024-01-05',
          completionDate: undefined,
          requestingDepartment: 'İnsan Kaynakları Müdürlüğü',
          responsibleUsers: ['Ali Özkan', 'Ayşe Yıldız'],
          jiraNumber: 'CITYPLUS-2024-003',
          status: 'pending',
          approvalStatus: 'pending',
          createdBy: user?.username || 'admin'
        }
      ];

      for (const item of testData) {
        await apiService.createYBSWorkItem(item);
      }

      alert('Test verisi başarıyla eklendi!');
      loadData();
    } catch (error) {
      console.error('Test verisi ekleme hatası:', error);
      alert('Test verisi eklenirken hata oluştu!');
    }
  };

  const exportToDatabase = async () => {
    try {
      // Local Storage'dan verileri al
      const stored = localStorage.getItem('ybs_work_items');
      if (!stored) {
        alert('Local Storage\'da veri bulunamadı!');
        return;
      }

      const localData = JSON.parse(stored);
      
      // CSV formatında export
      const csvContent = [
        ['ID', 'Title', 'Description', 'Request Date', 'Completion Date', 'Requesting Department', 'Responsible Users', 'JIRA Number', 'Status', 'Approval Status'],
        ...localData.map((item: any) => [
          item.id,
          item.title,
          item.description,
          item.requestDate,
          item.completionDate || '',
          item.requestingDepartment,
          item.responsibleUsers.join(', '),
          item.jiraNumber || '',
          item.status,
          item.approvalStatus
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      // CSV dosyasını indir
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `ybs_work_items_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(`Local Storage'daki ${localData.length} kayıt CSV dosyasına export edildi!\n\nDosya: ybs_work_items_${new Date().toISOString().split('T')[0]}.csv\n\nBu dosyayı Neon veritabanına import edebilirsiniz.`);
    } catch (error) {
      console.error('Export hatası:', error);
      alert('Export işlemi başarısız oldu!');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      requestDate: new Date().toISOString().split('T')[0],
      completionDate: '',
      requestingDepartment: '',
      responsibleUsers: [],
      jiraNumber: '',
      status: 'pending',
      approvalStatus: 'pending'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Tamamlandı';
      case 'in_progress': return 'Devam Ediyor';
      case 'pending': return 'Beklemede';
      case 'rejected': return 'Reddedildi';
      default: return 'Bilinmiyor';
    }
  };

  const getApprovalStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Onaylandı';
      case 'rejected': return 'Reddedildi';
      case 'pending': return 'Onay Bekliyor';
      default: return 'Bilinmiyor';
    }
  };

  // İstatistikler
  const totalItems = items.length;
  const pendingItems = items.filter(item => item.status === 'pending').length;
  const inProgressItems = items.filter(item => item.status === 'in_progress').length;
  const completedItems = items.filter(item => item.status === 'completed').length;
  const pendingApprovals = items.filter(item => item.approvalStatus === 'pending').length;

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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-600 text-xl font-semibold mb-4">Hata Oluştu</div>
              <div className="text-gray-600 mb-4">{error}</div>
              <button 
                onClick={() => {
                  setError(null);
                  loadData();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tekrar Dene
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-700 bg-clip-text text-transparent">
                YBS İş Programı
              </h1>
              <p className="text-slate-600 mt-1 text-lg">YBS işlerini yönetin ve onay süreçlerini takip edin</p>
            </div>
          </div>
        </div>
                 <div className="flex gap-3">
           <button
             onClick={() => {
               setEditItem(null);
               resetForm();
               setModalOpen(true);
             }}
             className="flex items-center gap-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-4 rounded-2xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 font-semibold text-lg"
           >
             <Plus className="w-6 h-6" />
             Yeni İş Ekle
           </button>
           <button
             onClick={addTestData}
             className="flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 font-semibold text-lg"
           >
             <Sparkles className="w-6 h-6" />
             Test Verisi Ekle
           </button>
           <button
             onClick={exportToDatabase}
             className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-4 rounded-2xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 font-semibold text-lg"
           >
             <Upload className="w-6 h-6" />
             Veritabanına Aktar
           </button>
         </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 font-medium">Toplam İş</p>
              <p className="text-3xl font-bold">{totalItems}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 font-medium">Bekleyen</p>
              <p className="text-3xl font-bold">{pendingItems}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 font-medium">Devam Eden</p>
              <p className="text-3xl font-bold">{inProgressItems}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 font-medium">Tamamlanan</p>
              <p className="text-3xl font-bold">{completedItems}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 font-medium">Onay Bekleyen</p>
              <p className="text-3xl font-bold">{pendingApprovals}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-purple-200" />
          </div>
        </Card>
      </div>

      {/* Filtreler */}
      <Card className="backdrop-blur-sm bg-white/80 border border-white/20 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="pending">Beklemede</option>
              <option value="in_progress">Devam Ediyor</option>
              <option value="completed">Tamamlandı</option>
              <option value="rejected">Reddedildi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Onay Durumu</label>
            <select
              value={filters.approvalStatus}
              onChange={(e) => setFilters({...filters, approvalStatus: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Tüm Onay Durumları</option>
              <option value="pending">Onay Bekliyor</option>
              <option value="approved">Onaylandı</option>
              <option value="rejected">Reddedildi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => setFilters({...filters, dateRange: {...filters.dateRange, start: e.target.value}})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => setFilters({...filters, dateRange: {...filters.dateRange, end: e.target.value}})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </Card>

             {/* Modern Tablo */}
       {loading ? (
         <div className="flex justify-center items-center h-64">
           <div className="text-lg text-gray-600">Yükleniyor...</div>
         </div>
       ) : (
         <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
           <div className="overflow-auto max-h-[calc(100vh-400px)]">
             <table className="w-full border border-gray-300">
                               <thead className="sticky top-0 bg-white/90 backdrop-blur-sm z-10">
                  <tr className="border-b-2 border-gray-400">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      İş Adı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Açıklama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Talep Eden Müdürlük
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Sorumlu Personel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      JIRA No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Onay Durumu
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      İşlemler
                    </th>
                  </tr>
                </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                 {filteredItems.length > 0 ? (
                   filteredItems.map((item) => (
                                           <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                                <FileText className="h-4 w-4 text-white" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{item.title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs">
                            <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                          </div>
                        </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center">
                           <div className="flex-shrink-0 h-8 w-8">
                             <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                               <Building className="h-4 w-4 text-white" />
                             </div>
                           </div>
                           <div className="ml-4">
                             <div className="text-sm font-medium text-gray-900">{item.requestingDepartment || '-'}</div>
                           </div>
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                         <div className="flex flex-wrap gap-1">
                           {(item.responsibleUsers || []).length > 0 ? (
                             (item.responsibleUsers || []).map((user, index) => (
                               <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                 {user}
                               </span>
                             ))
                           ) : (
                             <span className="text-gray-400 text-xs">-</span>
                           )}
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                         <div className="flex items-center">
                           <div className="flex-shrink-0 h-8 w-8">
                             <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                               <Hash className="h-4 w-4 text-white" />
                             </div>
                           </div>
                           <div className="ml-4">
                             <div className="text-sm font-medium text-gray-900">{item.jiraNumber || '-'}</div>
                           </div>
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                           {getStatusText(item.status)}
                         </span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getApprovalStatusColor(item.approvalStatus)}`}>
                           {getApprovalStatusText(item.approvalStatus)}
                         </span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                         <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setApprovalModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50"
                        title="Detayları Görüntüle"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      
                      {/* Onayla/Reddet Butonları - Sadece tamamlanmış ve onay bekleyen işler için */}
                      {item.status === 'completed' && item.approvalStatus === 'pending' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleApproval(item.id!, true)}
                            className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors"
                            title="Onayla"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleApproval(item.id!, false)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Reddet"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                        title="Düzenle"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(item.id!)}
                        className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                        title="Sil"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                       </td>
                     </tr>
                   ))
                                   ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        <div className="flex flex-col items-center py-8">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz iş kaydı yok</h3>
                          <p className="text-gray-500">İlk iş kaydınızı eklemek için yukarıdaki butonu kullanın.</p>
                        </div>
                      </td>
                    </tr>
                  )}
               </tbody>
             </table>
           </div>
         </div>
       )}

      {/* Yeni İş Ekleme Modal - Modern Tasarım */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
            {/* Modern Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {editItem ? 'İş Düzenle' : 'Yeni İş Ekle'}
                    </h2>
                    <p className="text-purple-100 text-sm">YBS iş programına yeni iş ekleyin veya mevcut işi düzenleyin</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* İlk Satır - İş Adı ve Talep Eden Müdürlük */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-red-500">*</span> İş Adı
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
                      placeholder="İş adını girin..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-red-500">*</span> Talep Eden Müdürlük
                    </label>
                    <input
                      type="text"
                      value={formData.requestingDepartment}
                      onChange={(e) => setFormData({...formData, requestingDepartment: e.target.value})}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
                      placeholder="Müdürlük adını girin..."
                    />
                  </div>
                </div>

                {/* İkinci Satır - Tarihler */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-red-500">*</span> Talep Tarihi
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.requestDate}
                        onChange={(e) => setFormData({...formData, requestDate: e.target.value})}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tamamlanma Tarihi
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.completionDate || ''}
                        onChange={(e) => setFormData({...formData, completionDate: e.target.value || ''})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Üçüncü Satır - JIRA No ve Durum */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      JIRA Kayıt No
                    </label>
                    <input
                      type="text"
                      value={formData.jiraNumber}
                      onChange={(e) => setFormData({...formData, jiraNumber: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
                      placeholder="CITYPLUS-XXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-red-500">*</span> Durum
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
                    >
                      <option value="pending">Beklemede</option>
                      <option value="in_progress">Devam Ediyor</option>
                      <option value="completed">Tamamlandı</option>
                      <option value="rejected">Reddedildi</option>
                    </select>
                  </div>
                </div>

                {/* Dördüncü Satır - Sorumlu Personel */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-red-500">*</span> Ana Sorumlu Personel
                    </label>
                    <select
                      value={formData.responsibleUsers[0] || ''}
                      onChange={(e) => {
                        const selectedUser = e.target.value;
                        if (selectedUser && !formData.responsibleUsers.includes(selectedUser)) {
                          setFormData({
                            ...formData,
                            responsibleUsers: [selectedUser, ...formData.responsibleUsers.filter(u => u !== selectedUser)]
                          });
                        }
                      }}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
                    >
                      <option value="">Ana sorumlu personel seçin...</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.username}>
                          {user.username} - {user.role}
                        </option>
                      ))}
                    </select>
                    {formData.responsibleUsers.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Seçili: {formData.responsibleUsers[0]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ek Sorumlu Personel
                    </label>
                    <select
                      value=""
                      onChange={(e) => {
                        const selectedUser = e.target.value;
                        if (selectedUser && !formData.responsibleUsers.includes(selectedUser)) {
                          setFormData({
                            ...formData,
                            responsibleUsers: [...formData.responsibleUsers, selectedUser]
                          });
                          // Dropdown'ı sıfırla
                          e.target.value = "";
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
                    >
                      <option value="">Ek sorumlu personel seçin...</option>
                      {users.filter(user => !formData.responsibleUsers.includes(user.username)).map((user) => (
                        <option key={user.id} value={user.username}>
                          {user.username} - {user.role}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Seçilen personel: {formData.responsibleUsers.slice(1).join(', ') || 'Yok'}
                    </p>
                  </div>
                </div>

                {/* Açıklama */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="text-red-500">*</span> Açıklama
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm resize-none"
                    placeholder="İş açıklamasını detaylı olarak girin..."
                  />
                </div>

                {/* Butonlar */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-xl hover:from-purple-700 hover:to-indigo-800 transition-all font-medium shadow-lg"
                  >
                    {editItem ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Güncelle
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Kaydet
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Onay Modal */}
      {approvalModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">İş Onayı</h2>
              <button
                onClick={() => setApprovalModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedItem.title}</h3>
                <p className="text-gray-600 mt-1">{selectedItem.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Talep Eden:</span>
                  <p className="text-gray-900">{selectedItem.requestingDepartment}</p>
                </div>
                                 <div>
                   <span className="text-sm font-medium text-gray-700">Sorumlu Personel:</span>
                   <p className="text-gray-900">{(selectedItem.responsibleUsers || []).join(', ')}</p>
                 </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">JIRA No:</span>
                  <p className="text-gray-900">{selectedItem.jiraNumber || '-'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Durum:</span>
                  <p className="text-gray-900">{getStatusText(selectedItem.status)}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => handleApproval(selectedItem.id!, false)}
                  className="px-4 py-2 text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <X className="h-4 w-4 inline mr-2" />
                  Reddet
                </button>
                <button
                  onClick={() => handleApproval(selectedItem.id!, true)}
                  className="px-4 py-2 text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Check className="h-4 w-4 inline mr-2" />
                  Onayla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YBSWorkProgram; 