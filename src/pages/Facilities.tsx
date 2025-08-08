import React, { useEffect, useState } from 'react';
import { apiService, Facility } from '../services/api';
import { Card } from '../components/Card';
import { Building2, Plus, Trash2, Edit, Search, Tv } from 'lucide-react';

const Facilities: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showControlCounts, setShowControlCounts] = useState(false);

  useEffect(() => {
    const fetchFacilities = async () => {
      setLoading(true);
      try {
        if (showControlCounts) {
          const data = await apiService.getFacilitiesWithControlCounts();
          setFacilities(data);
        } else {
          const data = await apiService.getFacilities();
          setFacilities(data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchFacilities();
  }, [showControlCounts]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const newFacility = await apiService.createFacility({ name });
    
    // Verileri otomatik yenile
    const fetchFacilities = async () => {
      setLoading(true);
      try {
        if (showControlCounts) {
          const data = await apiService.getFacilitiesWithControlCounts();
          setFacilities(data);
        } else {
          const data = await apiService.getFacilities();
          setFacilities(data);
        }
      } finally {
        setLoading(false);
      }
    };
    
    await fetchFacilities();
    setName('');
  };

  const handleDelete = async (id: number) => {
    try {
      await apiService.deleteFacility(id);
      // Verileri otomatik yenile
      const fetchFacilities = async () => {
        setLoading(true);
        try {
          if (showControlCounts) {
            const data = await apiService.getFacilitiesWithControlCounts();
            setFacilities(data);
          } else {
            const data = await apiService.getFacilities();
            setFacilities(data);
          }
        } finally {
          setLoading(false);
        }
      };
      
      await fetchFacilities();
    } catch (error) {
      console.error('Tesis silinirken hata oluştu:', error);
    }
  };

  // Filter facilities based on search term
  const filteredFacilities = facilities.filter(facility =>
    facility.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen overflow-y-auto p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Tesis Yönetimi
            </h1>
            <p className="text-gray-600 text-sm">Tesis takip ve yönetim sistemi</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowControlCounts(!showControlCounts)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
              showControlCounts
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="w-4 h-4 rounded-full border-2 border-current"></div>
            {showControlCounts ? 'Kontrol Sayıları Gizle' : 'Kontrol Sayılarını Göster'}
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tesis ara..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
        </div>
      </div>

      {/* Add Facility Form */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Plus className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Yeni Tesis Ekle</h3>
            <form onSubmit={handleAdd} className="flex gap-3">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tesis adını girin..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button 
                type="submit" 
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ekle
              </button>
            </form>
          </div>
        </div>
      </Card>

      {/* Facilities Table */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="text-lg text-gray-600">Yükleniyor...</div>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              <table className="w-full border border-gray-300">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr className="border-b-2 border-gray-400">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-300">
                      TESİS
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-300">
                      TV ADETİ
                    </th>
                    {showControlCounts && (
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-300">
                        KONTROL SAYISI
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-300">
                      AÇIKLAMA
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-300">
                      DURUM
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      İŞLEMLER
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacilities.map(facility => (
                    <tr key={facility.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-4 py-3 border-r border-gray-300">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full">
                            <Building2 className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">{facility.id}</span>
                            <div className="text-sm text-gray-500">{facility.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-300">
                        <div className="flex items-center gap-2">
                          <Tv className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-900">{facility.tvCount || 0}</span>
                        </div>
                      </td>
                      {showControlCounts && (
                        <td className="px-4 py-3 border-r border-gray-300">
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-blue-100 rounded-full">
                              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                            </div>
                            <span className="text-gray-900 font-medium">{facility.control_count || 0}</span>
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3 border-r border-gray-300">
                        <span className="text-gray-500">{facility.description || '-'}</span>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-300">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Aktif
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button 
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Düzenle"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={() => handleDelete(facility.id)}
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button 
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Onayla"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {!loading && facilities.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz tesis eklenmemiş</h3>
            <p className="text-gray-500">İlk tesisinizi eklemek için yukarıdaki formu kullanın.</p>
          </div>
        </Card>
      )}

      {!loading && facilities.length > 0 && filteredFacilities.length === 0 && searchTerm && (
        <Card>
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sonuç bulunamadı</h3>
            <p className="text-gray-500">"{searchTerm}" için tesis bulunamadı. Farklı bir arama terimi deneyin.</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Facilities; 