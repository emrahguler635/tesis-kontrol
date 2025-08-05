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
    } catch (error) {
      console.error('BağTV tesisleri alınamadı:', error);
    } finally {
      setLoading(false);
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
        title: "text-xl",
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
        title: "text-2xl",
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
        title: "text-3xl",
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
      header: "flex-shrink-0 p-6",
      title: "text-4xl",
      subtitle: "text-lg",
      statsGrid: "grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6",
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
    <div className={classes.container}>
      {/* Sabit Başlık ve İstatistikler */}
      <div className={classes.header}>
        {/* Başlık */}
        <div className="flex items-center justify-between mb-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Toplam TV */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between h-40 p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <div className="flex-1">
                <p className="text-base font-medium text-blue-100 mb-3">Toplam TV</p>
                <p className="text-4xl font-bold text-white mb-2">{totalTV}</p>
                <p className="text-sm text-blue-200">Aktif TV</p>
              </div>
              <div className="p-5 bg-white/20 rounded-xl backdrop-blur-sm">
                <Tv className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>

          {/* Aktif Tesis */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between h-40 p-6 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <div className="flex-1">
                <p className="text-base font-medium text-green-100 mb-3">Aktif Tesis</p>
                <p className="text-4xl font-bold text-white mb-2">{facilities.filter(f => f.status === 'Aktif').length}</p>
                <p className="text-sm text-green-200">Çalışan Tesis</p>
              </div>
              <div className="p-5 bg-white/20 rounded-xl backdrop-blur-sm">
                <Building2 className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>

          {/* Toplam Tesis */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between h-40 p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <div className="flex-1">
                <p className="text-base font-medium text-purple-100 mb-3">Toplam Tesis</p>
                <p className="text-4xl font-bold text-white mb-2">{facilities.length}</p>
                <p className="text-sm text-purple-200">Tüm Tesisler</p>
              </div>
              <div className="p-5 bg-white/20 rounded-xl backdrop-blur-sm">
                <Calendar className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>

          {/* Ortalama TV */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between h-40 p-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
              <div className="flex-1">
                <p className="text-base font-medium text-orange-100 mb-3">Ortalama TV</p>
                <p className="text-4xl font-bold text-white mb-2">{facilities.length > 0 ? (totalTV / facilities.length).toFixed(1) : '0.0'}</p>
                <p className="text-sm text-orange-200">Tesis Başına</p>
              </div>
              <div className="p-5 bg-white/20 rounded-xl backdrop-blur-sm">
                <Tv className="h-12 w-12 text-white" />
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
        <div className="bg-white rounded-lg p-6 w-full shadow-lg mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            <h2 className="text-xl font-bold">Tüm Tesislerin Kontrol Geçmişi</h2>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <input type="date" value={allFilterStart} onChange={e => setAllFilterStart(e.target.value)} className="border rounded px-2 py-1" />
              <span>-</span>
              <input type="date" value={allFilterEnd} onChange={e => setAllFilterEnd(e.target.value)} className="border rounded px-2 py-1" />
              <button onClick={handleAllFilter} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs">Filtrele</button>
              <button onClick={handleAllExportExcel} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs">Excel'e Aktar</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Tesis</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Ne Yapıldı</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Açıklama</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Kontrol Eden</th>
                </tr>
              </thead>
              <tbody>
                {allFilteredControls.map((control: any) => (
                  <tr key={control._id}>
                    <td className="px-2 py-1">{(facilities.find((f: any) => f._id === control.facilityId || f.id === control.facilityId)?.name) || ''}</td>
                    <td className="px-2 py-1">{control.date ? new Date(control.date).toLocaleDateString('tr-TR') : ''}</td>
                    <td className="px-2 py-1">{control.action}</td>
                    <td className="px-2 py-1">{control.description}</td>
                    <td className="px-2 py-1">{control.checkedBy}</td>
                  </tr>
                ))}
                {allFilteredControls.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-2">Kayıt yok</td></tr>
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

      {/* Detay Paneli */}
      {selectedFacility && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{selectedFacility.name} - Kontrol Geçmişi</h2>
              <button onClick={closeDetailPanel} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} className="border rounded px-2 py-1" />
                <span>-</span>
                <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} className="border rounded px-2 py-1" />
                <button onClick={handleFilter} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs">Filtrele</button>
                <button onClick={handleExportExcel} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs">Excel'e Aktar</button>
              </div>
            </div>
            <form onSubmit={handleControlSubmit} className="mb-4 p-6 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tarih</label>
                  <input 
                    type="date" 
                    name="date" 
                    value={controlForm.date} 
                    onChange={handleControlFormChange} 
                    required 
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kontrol Eden</label>
                  <select 
                    name="checkedBy" 
                    value={controlForm.checkedBy} 
                    onChange={handleControlFormChange} 
                    required 
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
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
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button 
                  type="submit" 
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium" 
                  disabled={controlSaving}
                >
                  {controlSaving ? 'Kaydediliyor...' : 'Ekle'}
                </button>
              </div>
            </form>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Ne Yapıldı</th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Açıklama</th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Kontrol Eden</th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredControls.map((control: any) => (
                    <tr key={control._id}>
                      <td className="px-2 py-1">{control.date ? new Date(control.date).toLocaleDateString('tr-TR') : ''}</td>
                      <td className="px-2 py-1">{control.action}</td>
                      <td className="px-2 py-1">{control.description}</td>
                      <td className="px-2 py-1">{control.checkedBy}</td>
                      <td className="px-2 py-1">
                        <button className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs" onClick={() => handleDeleteControl(control._id)}>Sil</button>
                      </td>
                    </tr>
                  ))}
                  {filteredControls.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-gray-400 py-2">Kayıt yok</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BagTV; 