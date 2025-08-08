import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import * as XLSX from 'xlsx';
import { Plus, Search, Tv, Building2, Calendar, Edit, Trash2, Eye, CheckSquare } from 'lucide-react';

interface BagTVFacility {
  id: number;
  name: string;
  tvCount: number;
  status: string;
}

interface BagTVControl {
  id: number;
  facilityId: number;
  title: string;
  date: string;
  action: string;
  description?: string;
}

const BagTV: React.FC = () => {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTV, setTotalTV] = useState(0);
  const [controlCount, setControlCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', tvCount: '', description: '', status: 'Aktif' });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<any>(null);
  const [controls, setControls] = useState<any[]>([]);
  const [filteredControls, setFilteredControls] = useState<any[]>([]);
  const [controlForm, setControlForm] = useState({ date: '', action: '', description: '', checkedBy: '' });
  const [controlSaving, setControlSaving] = useState(false);
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [allControls, setAllControls] = useState<any[]>([]);
  const [allFilteredControls, setAllFilteredControls] = useState<any[]>([]);
  const [showAllControls, setShowAllControls] = useState(false);
  const [allFilterStart, setAllFilterStart] = useState('');
  const [allFilterEnd, setAllFilterEnd] = useState('');
  const [facilitySearchTerm, setFacilitySearchTerm] = useState('');
  const [controlSearchTerm, setControlSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [totalControlCount, setTotalControlCount] = useState(0);

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

  const fetchFacilities = async () => {
    try {
      const data = await apiService.getBagTVFacilities();
      // Backend'den gelen tv_count alanını frontend'in beklediği tvCount formatına dönüştür
      const formattedData = data.map((facility: any) => ({
        ...facility,
        tvCount: facility.tv_count || 0
      }));
      setFacilities(formattedData);
      const tvSum = formattedData.reduce((sum: number, f: any) => sum + (f.tvCount || 0), 0);
      setTotalTV(tvSum);
      setControlCount(0);
      
      // Toplam kontrol sayısını hesapla
      await calculateTotalControlCount();
    } catch (error) {
      console.error('BağTV tesisleri alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toplam kontrol sayısını hesapla
  const calculateTotalControlCount = async () => {
    try {
      const allControls = await apiService.getBagTVControls();
      setTotalControlCount(allControls.length);
    } catch (error) {
      console.error('Kontrol sayısı hesaplanamadı:', error);
      setTotalControlCount(0);
    }
  };

  useEffect(() => {
    fetchFacilities();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await apiService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Kullanıcılar alınamadı:', error);
    }
  };

  // Responsive tasarım için dinamik sınıflar
  const getResponsiveClasses = () => {
    const { width, height } = screenSize;
    
    // Mobil
    if (width < 768) {
      return {
        container: "h-screen flex flex-col overflow-hidden",
        header: "flex-shrink-0 p-2",
        title: "text-lg",
        subtitle: "text-sm",
        statsGrid: "grid grid-cols-2 gap-2 mb-2",
        tableContainer: "flex-1 min-h-0 overflow-hidden",
        table: "h-full overflow-auto",
        buttonSize: "text-xs px-2 py-1"
      };
    }
    
    // Tablet
    if (width < 1024) {
      return {
        container: "h-screen flex flex-col overflow-hidden",
        header: "flex-shrink-0 p-3",
        title: "text-xl",
        subtitle: "text-sm",
        statsGrid: "grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3",
        tableContainer: "flex-1 min-h-0 overflow-hidden",
        table: "h-full overflow-auto",
        buttonSize: "text-sm px-3 py-1"
      };
    }
    
    // Desktop
    if (width < 1440) {
      return {
        container: "h-screen flex flex-col overflow-hidden",
        header: "flex-shrink-0 p-4",
        title: "text-2xl",
        subtitle: "text-base",
        statsGrid: "grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4",
        tableContainer: "flex-1 min-h-0 overflow-hidden",
        table: "h-full overflow-auto",
        buttonSize: "text-sm px-3 py-1"
      };
    }
    
    // Büyük ekranlar
    return {
      container: "h-screen flex flex-col overflow-hidden",
      header: "flex-shrink-0 p-5",
      title: "text-3xl",
      subtitle: "text-lg",
      statsGrid: "grid grid-cols-2 lg:grid-cols-4 gap-5 mb-5",
      tableContainer: "flex-1 min-h-0 overflow-hidden",
      table: "h-full overflow-auto",
      buttonSize: "text-base px-4 py-2"
    };
  };

  const handleOpenModal = (facility?: any) => {
    if (facility) {
      setForm({
        name: facility.name || '',
        tvCount: facility.tvCount?.toString() || '',
        description: facility.description || '',
        status: facility.status || 'Aktif',
      });
      setEditId(facility._id || facility.id);
    } else {
      setForm({ name: '', tvCount: '', description: '', status: 'Aktif' });
      setEditId(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditId(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('BagTV form submitted:', form);
    setSaving(true);
    try {
      if (editId) {
        console.log('Updating facility with ID:', editId);
        await apiService.updateBagTVFacility(editId, {
          name: form.name,
          tvCount: parseInt(form.tvCount) || 0,
          description: form.description,
          status: form.status
        });
      } else {
        console.log('Creating new facility');
        await apiService.createBagTVFacility({
          name: form.name,
          tvCount: parseInt(form.tvCount) || 0,
          description: form.description,
          status: form.status
        });
      }
      await fetchFacilities();
      handleCloseModal();
    } catch (error) {
      console.error('BagTV facility save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu tesisi silmek istediğinizden emin misiniz?')) {
      try {
        await apiService.deleteBagTVFacility(id);
        await fetchFacilities();
      } catch (error) {
        console.error('BagTV facility delete error:', error);
      }
    }
  };

  const openDetailPanel = async (facility: any) => {
    setSelectedFacility(facility);
    await fetchControls(facility._id || facility.id);
    // Tarih alanını bugünün tarihi ile doldur
    const today = new Date().toISOString().split('T')[0];
    setControlForm({ date: today, action: '', description: '', checkedBy: '' });
  };

  const closeDetailPanel = () => {
    setSelectedFacility(null);
    setControls([]);
    setFilteredControls([]);
  };

  const fetchControls = async (facilityId: string) => {
    try {
      console.log('Fetching controls for facility:', facilityId);
      console.log('Facility ID type:', typeof facilityId);
      console.log('Facility ID value:', facilityId);
      
      const data = await apiService.getBagTVControls(facilityId);
      console.log('Fetched controls:', data);
      setControls(data);
      setFilteredControls(data);
    } catch (error) {
      console.error('BagTV controls fetch error:', error);
      alert('Kontroller alınırken hata oluştu: ' + error.message);
    }
  };

  const handleControlFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setControlForm({ ...controlForm, [e.target.name]: e.target.value });
  };

  const handleControlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', controlForm);
    console.log('Selected facility:', selectedFacility);
    
    setControlSaving(true);
    try {
      const controlData = {
        facilityId: selectedFacility._id || selectedFacility.id,
        date: controlForm.date,
        action: controlForm.action,
        description: controlForm.description,
        checkedBy: controlForm.checkedBy
      };
      
      console.log('Sending control data:', controlData);
      
      const result = await apiService.createBagTVControl(controlData);
      console.log('API response:', result);
      
      // Formu temizle
      const today = new Date().toISOString().split('T')[0];
      setControlForm({ date: today, action: '', description: '', checkedBy: '' });
      
      // Kontrolleri yeniden yükle
      await fetchControls(selectedFacility._id || selectedFacility.id);
      
      // Kontrol sayısını güncelle
      await calculateTotalControlCount();
    } catch (error) {
      console.error('BagTV control save error:', error);
      alert('Kayıt yapılırken hata oluştu: ' + error.message);
    } finally {
      setControlSaving(false);
    }
  };

  const handleDeleteControl = async (id: string) => {
    if (window.confirm('Bu kontrolü silmek istediğinizden emin misiniz?')) {
      try {
        await apiService.deleteBagTVControl(id);
        await fetchControls(selectedFacility._id || selectedFacility.id);
        
        // Kontrol sayısını güncelle
        await calculateTotalControlCount();
      } catch (error) {
        console.error('BagTV control delete error:', error);
      }
    }
  };

  const handleFilter = () => {
    let filtered = controls;
    if (filterStart && filterEnd) {
      filtered = filtered.filter((control: any) => {
        const controlDate = new Date(control.date);
        const start = new Date(filterStart);
        const end = new Date(filterEnd);
        return controlDate >= start && controlDate <= end;
      });
    }
    setFilteredControls(filtered);
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredControls);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BagTV Controls');
    XLSX.writeFile(wb, `bagtv_controls_${selectedFacility?.name || 'facility'}.xlsx`);
  };

  const fetchAllControls = async () => {
    try {
      const data = await apiService.getBagTVControls();
      setAllControls(data);
      setAllFilteredControls(data);
    } catch (error) {
      console.error('All BagTV controls fetch error:', error);
    }
  };

  const handleAllFilter = () => {
    let filtered = allControls;
    if (allFilterStart && allFilterEnd) {
      filtered = filtered.filter((control: any) => {
        const controlDate = new Date(control.date);
        const start = new Date(allFilterStart);
        const end = new Date(allFilterEnd);
        return controlDate >= start && controlDate <= end;
      });
    }
    setAllFilteredControls(filtered);
  };

  const handleAllExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(allFilteredControls);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'All BagTV Controls');
    XLSX.writeFile(wb, 'all_bagtv_controls.xlsx');
  };

  const filteredFacilities = facilities.filter((facility: any) =>
    facility.name.toLowerCase().includes(facilitySearchTerm.toLowerCase())
  );

  const classes = getResponsiveClasses();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`${classes.container} h-screen overflow-y-auto`}>
      {/* Sabit Başlık ve İstatistikler */}
      <div className={classes.header}>
        {/* Başlık */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg mr-4">
              <Tv className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent ${classes.title}`}>
                BağTV Yönetimi
              </h1>
              <p className={`text-gray-600 ${classes.subtitle}`}>Tesis ve kontrol yönetim sistemi</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              onClick={() => {
                setShowAllControls(!showAllControls);
                if (!showAllControls) fetchAllControls();
              }}
            >
              <CheckSquare className="h-4 w-4" />
              {showAllControls ? 'Kontrolleri Gizle' : 'Tüm Kontrolleri Göster'}
            </button>
            <button
              className={`bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 ${classes.buttonSize}`}
              onClick={() => handleOpenModal()}
            >
              <Plus className="h-4 w-4" />
              Tesis Ekle
            </button>
          </div>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Toplam TV */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between h-32 p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-100 mb-2">Toplam TV</p>
                <p className="text-3xl font-bold text-white mb-1">{totalTV}</p>
                <p className="text-xs text-blue-200">Aktif TV</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Tv className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Aktif Tesis */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between h-32 p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <div className="flex-1">
                <p className="text-sm font-medium text-green-100 mb-2">Aktif Tesis</p>
                <p className="text-3xl font-bold text-white mb-1">{facilities.filter(f => f.status === 'Aktif').length}</p>
                <p className="text-xs text-green-200">Çalışan Tesis</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Toplam Tesis */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between h-32 p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-100 mb-2">Kontrol Edilen Toplam Tesis</p>
                <p className="text-3xl font-bold text-white mb-1">{totalControlCount}</p>
                <p className="text-xs text-purple-200">Kontrol Sayısı</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Calendar className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Ortalama TV */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between h-32 p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-100 mb-2">Ortalama TV</p>
                <p className="text-3xl font-bold text-white mb-1">{facilities.length > 0 ? (totalTV / facilities.length).toFixed(1) : '0'}</p>
                <p className="text-xs text-orange-200">Tesis Başına</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Tv className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Tesis Yönetimi Başlığı */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg mr-4">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                Tesis Yönetimi
              </h2>
              <p className="text-gray-600 text-sm">Tesis takip ve yönetim sistemi</p>
            </div>
          </div>
          
          {/* Tesis Arama */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={facilitySearchTerm}
                onChange={(e) => setFacilitySearchTerm(e.target.value)}
                placeholder="Tesis ara..."
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            {facilitySearchTerm && (
              <button
                onClick={() => setFacilitySearchTerm('')}
                className="text-gray-400 hover:text-gray-600 transition-colors px-2 py-2"
                title="Aramayı temizle"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {facilitySearchTerm && (
          <div className="mb-4 text-sm text-gray-600">
            "{facilitySearchTerm}" için {filteredFacilities.length} tesis bulundu
          </div>
        )}
      </div>

      {/* Kaydırılabilir Tesis Listesi */}
      <div className={classes.tableContainer}>
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden h-full">
          <div className={classes.table}>
            <table className="w-full border border-gray-300">
              <thead className="sticky top-0 bg-white/90 backdrop-blur-sm z-10">
                <tr className="border-b-2 border-gray-400">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    TESİS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    TV ADETİ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    AÇIKLAMA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    DURUM
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    İŞLEMLER
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFacilities.map((facility: any) => (
                  <tr key={facility._id || facility.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{facility.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Tv className="h-4 w-4 text-gray-400 mr-2" />
                        {facility.tvCount ?? '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {facility.description ?? '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        {facility.status ?? 'Aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors" 
                          onClick={() => handleOpenModal(facility)}
                          title="Düzenle"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-1 text-red-600 hover:text-red-800 transition-colors" 
                          onClick={() => handleDelete(facility._id || facility.id)}
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-1 text-gray-600 hover:text-gray-800 transition-colors" 
                          onClick={() => openDetailPanel(facility)}
                          title="Kontrol"
                        >
                          <CheckSquare className="h-4 w-4" />
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

      

      {/* Tüm Kontroller Paneli */}
      {showAllControls && (
        <div className="bg-white rounded-lg p-4 w-full shadow-lg mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
            <h2 className="text-lg font-bold">Tüm Tesislerin Kontrol Geçmişi</h2>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <div className="flex items-center gap-1">
                <input 
                  type="date" 
                  value={allFilterStart} 
                  onChange={e => setAllFilterStart(e.target.value)} 
                  className="border rounded px-2 py-1 text-sm" 
                />
                <span className="text-gray-500">-</span>
                <input 
                  type="date" 
                  value={allFilterEnd} 
                  onChange={e => setAllFilterEnd(e.target.value)} 
                  className="border rounded px-2 py-1 text-sm" 
                />
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={handleAllFilter} 
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                >
                  Filtrele
                </button>
                <button 
                  onClick={handleAllExportExcel} 
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                >
                  Excel'e Aktar
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tesis
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ne Yapıldı
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontrol Eden
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allFilteredControls.map((control: any) => (
                  <tr key={control._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-2 py-2 text-xs font-medium text-gray-900">
                      {(facilities.find((f: any) => f._id === control.facilityId || f.id === control.facilityId)?.name) || ''}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900">
                      {control.date ? new Date(control.date).toLocaleDateString('tr-TR') : ''}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 max-w-32 truncate" title={control.action}>
                      {control.action}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-600 max-w-48 truncate" title={control.description}>
                      {control.description}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900">
                      {control.checkedBy || '-'}
                    </td>
                  </tr>
                ))}
                {allFilteredControls.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-4">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm">Kayıt bulunamadı</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">{editId ? 'Tesis Düzenle' : 'Tesis Ekle'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Tesis Adı</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">TV Adeti</label>
                <input
                  type="number"
                  name="tvCount"
                  value={form.tvCount}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Açıklama</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Durum</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Pasif">Pasif</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                  disabled={saving}
                >
                  {saving ? 'Kaydediliyor...' : (editId ? 'Güncelle' : 'Kaydet')}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detay Paneli - Modern Kontrol Geçmişi */}
      {selectedFacility && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
            {/* Modern Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedFacility.name} - Kontrol Geçmişi</h2>
                    <p className="text-blue-100 text-sm">Tesis kontrol geçmişini görüntüleyin ve yönetin</p>
                  </div>
                </div>
                <button 
                  onClick={closeDetailPanel} 
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Filtre Bölümü */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <input 
                      type="date" 
                      value={filterStart} 
                      onChange={e => setFilterStart(e.target.value)} 
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                    <span className="text-gray-500">-</span>
                    <input 
                      type="date" 
                      value={filterEnd} 
                      onChange={e => setFilterEnd(e.target.value)} 
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleFilter} 
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                      </svg>
                      Filtrele
                    </button>
                    <button 
                      onClick={handleExportExcel} 
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Excel'e Aktar
                    </button>
                  </div>
                </div>
              </div>

              {/* Yeni Kontrol Ekleme Formu */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Yeni Kontrol Ekle</h3>
                </div>
                
                <form onSubmit={handleControlSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tarih</label>
                      <input 
                        type="date" 
                        name="date" 
                        value={controlForm.date} 
                        onChange={handleControlFormChange} 
                        required 
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kontrol Eden</label>
                      <select 
                        name="checkedBy" 
                        value={controlForm.checkedBy} 
                        onChange={handleControlFormChange} 
                        required 
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="">Kullanıcı seçin...</option>
                        {users.map((user: any) => (
                          <option key={user.id || user._id} value={user.username}>
                            {user.username} - {user.role}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ne Yapıldı</label>
                      <input 
                        type="text" 
                        name="action" 
                        value={controlForm.action} 
                        onChange={handleControlFormChange} 
                        placeholder="Yapılan işlemi açıklayın..." 
                        required 
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" 
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                      <textarea 
                        name="description" 
                        value={controlForm.description} 
                        onChange={handleControlFormChange} 
                        placeholder="Detaylı açıklama ekleyin..." 
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white resize-none" 
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      type="submit" 
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg" 
                      disabled={controlSaving}
                    >
                      {controlSaving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Kaydediliyor...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Ekle
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Kontrol Geçmişi Tablosu */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Kontrol Geçmişi</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Tarih
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Ne Yapıldı
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            Açıklama
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Kontrol Eden
                          </div>
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşlem
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredControls.map((control: any) => (
                        <tr key={control._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {control.date ? new Date(control.date).toLocaleDateString('tr-TR') : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{control.action}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600 max-w-xs truncate" title={control.description}>
                              {control.description}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{control.checkedBy}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm"
                              onClick={() => handleDeleteControl(control._id)}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Sil
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredControls.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-12">
                            <div className="flex flex-col items-center gap-3">
                              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <h3 className="text-lg font-medium text-gray-900">Kontrol Geçmişi Yok</h3>
                              <p className="text-gray-500">Bu tesis için henüz kontrol kaydı bulunmuyor.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BagTV; 