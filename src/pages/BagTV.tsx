import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import * as XLSX from 'xlsx';
import { Search, Building2, Tv, Calendar, Filter } from 'lucide-react';

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
  }, []);

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
          tvCount: Number(form.tvCount),
          description: form.description,
          status: form.status
        });
      } else {
        console.log('Creating new facility');
        await apiService.createBagTVFacility({
          name: form.name,
          tvCount: Number(form.tvCount),
          description: form.description,
          status: form.status
        });
      }
      console.log('Facility saved successfully');
      setIsModalOpen(false);
      fetchFacilities();
    } catch (err) {
      console.error('Error saving facility:', err);
      alert('Tesis kaydedilirken hata oluştu!');
    } finally {
      setSaving(false);
      setEditId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu tesisi silmek istediğinize emin misiniz?')) return;
    try {
      await apiService.deleteBagTVFacility(id);
      fetchFacilities();
    } catch (err) {
      alert('Tesis silinirken hata oluştu!');
    }
  };

  const openDetailPanel = async (facility: any) => {
    setSelectedFacility(facility);
    await fetchControls(facility._id?.toString() || facility.id?.toString());
  };

  const closeDetailPanel = () => {
    setSelectedFacility(null);
    setControls([]);
    setFilteredControls([]);
    setControlForm({ date: '', action: '', description: '', checkedBy: '' });
    setFilterStart('');
    setFilterEnd('');
  };

  const fetchControls = async (facilityId: string) => {
    try {
      const data = await apiService.getBagTVControls(facilityId);
      setControls(data);
      setFilteredControls(data);
    } catch (err) {
      setControls([]);
      setFilteredControls([]);
    }
  };

  const handleControlFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setControlForm({ ...controlForm, [e.target.name]: e.target.value });
  };

  const handleControlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacility) return;
    setControlSaving(true);
    try {
      await apiService.createBagTVControl({
        facilityId: selectedFacility._id?.toString() || selectedFacility.id?.toString(),
        date: controlForm.date,
        action: controlForm.action,
        description: controlForm.description,
        checkedBy: controlForm.checkedBy
      });
      setControlForm({ date: '', action: '', description: '', checkedBy: '' });
      await fetchControls(selectedFacility._id?.toString() || selectedFacility.id?.toString());
    } catch (err) {
      alert('Kontrol kaydı eklenirken hata oluştu!');
    } finally {
      setControlSaving(false);
    }
  };

  const handleDeleteControl = async (id: string) => {
    if (!window.confirm('Bu kontrol kaydını silmek istediğinize emin misiniz?')) return;
    try {
      await apiService.deleteBagTVControl(id);
      if (selectedFacility) await fetchControls(selectedFacility._id?.toString() || selectedFacility.id?.toString());
    } catch (err) {
      alert('Kontrol kaydı silinirken hata oluştu!');
    }
  };

  // Tarih aralığı filtreleme
  const handleFilter = () => {
    if (!filterStart && !filterEnd) {
      setFilteredControls(controls);
      return;
    }
    const start = filterStart ? new Date(filterStart) : null;
    const end = filterEnd ? new Date(filterEnd) : null;
    setFilteredControls(
      controls.filter((c: any) => {
        const d = new Date(c.date);
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      })
    );
  };

  // Excel'e aktar
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredControls.map((c: any) => ({
        Tarih: c.date ? new Date(c.date).toLocaleDateString('tr-TR') : '',
        'Ne Yapıldı': c.action,
        Açıklama: c.description,
        'Kontrol Eden': c.checkedBy
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kontrol Gecmisi');
    XLSX.writeFile(wb, `${selectedFacility?.name || 'kontrol'}-gecmis.xlsx`);
  };

  // Tüm kontrolleri çek
  const fetchAllControls = async () => {
    try {
      const data = await apiService.getBagTVControls();
      setAllControls(data);
      setAllFilteredControls(data);
    } catch (err) {
      setAllControls([]);
      setAllFilteredControls([]);
    }
  };

  // Tüm kontrollerde tarih aralığı filtreleme
  const handleAllFilter = () => {
    if (!allFilterStart && !allFilterEnd) {
      setAllFilteredControls(allControls);
      return;
    }
    const start = allFilterStart ? new Date(allFilterStart) : null;
    const end = allFilterEnd ? new Date(allFilterEnd) : null;
    setAllFilteredControls(
      allControls.filter((c: any) => {
        const d = new Date(c.date);
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      })
    );
  };

  // Tüm kontrolleri Excel'e aktar
  const handleAllExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      allFilteredControls.map((c: any) => ({
        Tesis: (facilities.find((f: any) => f._id === c.facilityId || f.id === c.facilityId)?.name) || '',
        Tarih: c.date ? new Date(c.date).toLocaleDateString('tr-TR') : '',
        'Ne Yapıldı': c.action,
        Açıklama: c.description,
        'Kontrol Eden': c.checkedBy
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TumKontrolGecmisi');
    XLSX.writeFile(wb, 'tum-kontrol-gecmisi.xlsx');
  };

  const filteredFacilities = facilities.filter((facility: any) =>
    facility.name?.toLowerCase().includes(facilitySearchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* İstatistikler - Küçük ve Şık */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Tv className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam TV</p>
              <p className="text-2xl font-bold text-gray-900">{totalTV}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktif Tesis</p>
              <p className="text-2xl font-bold text-gray-900">{facilities.filter(f => f.status === 'Aktif').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-teal-100 rounded-lg">
              <Calendar className="h-6 w-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Tesis</p>
              <p className="text-2xl font-bold text-gray-900">{facilities.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Tv className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ortalama TV</p>
              <p className="text-2xl font-bold text-gray-900">{facilities.length > 0 ? (totalTV / facilities.length).toFixed(1) : '0.0'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tesis Listesi */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center mb-4 justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Tv className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                BağTV Yönetimi
              </h1>
              <p className="text-gray-600 mt-1">Tesis ve kontrol yönetim sistemi</p>
            </div>
          </div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => handleOpenModal()}
          >
            + Tesis Ekle
          </button>
        </div>
        {/* Tesis Arama */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Search className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={facilitySearchTerm}
                onChange={(e) => setFacilitySearchTerm(e.target.value)}
                placeholder="Tesis ara..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {facilitySearchTerm && (
              <button
                onClick={() => setFacilitySearchTerm('')}
                className="text-gray-400 hover:text-gray-600 transition-colors px-3 py-2"
                title="Aramayı temizle"
              >
                ×
              </button>
            )}
          </div>
          {facilitySearchTerm && (
            <div className="mt-2 text-sm text-gray-600">
              "{facilitySearchTerm}" için {filteredFacilities.length} tesis bulundu
            </div>
          )}
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tesis</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">TV Adeti</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Açıklama</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredFacilities.map((facility: any) => (
              <tr key={facility._id || facility.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-semibold">{facility.name}</td>
                <td className="px-4 py-2">{facility.tvCount ?? '-'}</td>
                <td className="px-4 py-2">{facility.description ?? '-'}</td>
                <td className="px-4 py-2">{facility.status ?? '-'}</td>
                <td className="px-4 py-2 space-x-2">
                  <button className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs" onClick={() => handleOpenModal(facility)}>Düzenle</button>
                  <button className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs" onClick={() => handleDelete(facility._id || facility.id)}>Sil</button>
                  <button className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs" onClick={() => openDetailPanel(facility)}>Detay</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                  min={0}
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
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  disabled={saving}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={saving}
                >
                  {saving ? 'Kaydediliyor...' : (editId ? 'Güncelle' : 'Kaydet')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detay Paneli (ana ekranın altında, tam genişlikte ve filtreli) */}
      {selectedFacility && (
        <div className="bg-white rounded-lg p-6 w-full shadow-lg mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            <h2 className="text-xl font-bold">{selectedFacility.name} - Kontrol Geçmişi</h2>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} className="border rounded px-2 py-1" />
              <span>-</span>
              <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} className="border rounded px-2 py-1" />
              <button onClick={handleFilter} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs">Filtrele</button>
              <button onClick={handleExportExcel} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs">Excel'e Aktar</button>
              <button onClick={closeDetailPanel} className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 text-xs">Kapat</button>
            </div>
          </div>
          <form onSubmit={handleControlSubmit} className="space-y-2 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input type="date" name="date" value={controlForm.date} onChange={handleControlFormChange} required className="border rounded px-2 py-1" />
              <input type="text" name="action" value={controlForm.action} onChange={handleControlFormChange} placeholder="Ne yapıldı?" required className="border rounded px-2 py-1" />
              <input type="text" name="checkedBy" value={controlForm.checkedBy} onChange={handleControlFormChange} placeholder="Kontrol Eden" required className="border rounded px-2 py-1" />
              <input type="text" name="description" value={controlForm.description} onChange={handleControlFormChange} placeholder="Açıklama" className="border rounded px-2 py-1" />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={controlSaving}>
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
      )}

      <div className="flex justify-end">
        <button
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mb-2"
          onClick={() => {
            setShowAllControls(!showAllControls);
            if (!showAllControls) fetchAllControls();
          }}
        >
          {showAllControls ? 'Tüm Kontrolleri Gizle' : 'Tüm Kontrolleri Göster'}
        </button>
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
    </div>
  );
};

export default BagTV; 