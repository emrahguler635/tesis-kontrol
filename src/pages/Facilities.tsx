import React, { useEffect, useState } from 'react';
import { apiService, Facility } from '../services/api';
import { Card } from '../components/Card';
import { Building2, Plus, Trash2, Edit, Search } from 'lucide-react';

const Facilities: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchFacilities = async () => {
      setLoading(true);
      try {
        const data = await apiService.getFacilities();
        setFacilities(data);
      } finally {
        setLoading(false);
      }
    };
    fetchFacilities();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const newFacility = await apiService.createFacility({ name });
    setFacilities([...facilities, newFacility]);
    setName('');
  };

  const handleDelete = async (id: number) => {
    try {
      await apiService.deleteFacility(id);
      setFacilities(facilities.filter(f => f.id !== id));
    } catch (error) {
      console.error('Tesis silinirken hata oluştu:', error);
    }
  };

  // Filter facilities based on search term
  const filteredFacilities = facilities.filter(facility =>
    facility.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
          <Building2 className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Tesisler
          </h1>
          <p className="text-gray-600 mt-1">Tesis yönetimi ve kontrol sistemi</p>
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

      {/* Search Bar */}
      <Card>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Search className="h-5 w-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tesis ara..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Aramayı temizle"
            >
              ×
            </button>
          )}
        </div>
        {searchTerm && (
          <div className="mt-3 text-sm text-gray-600">
            "{searchTerm}" için {filteredFacilities.length} sonuç bulundu
          </div>
        )}
      </Card>

      {/* Facilities List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Yükleniyor...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFacilities.map(facility => (
            <Card key={facility.id} className="hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {facility.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Tesis ID: {facility.id}
                    </p>
                  </div>
                </div>
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
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Durum</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Aktif
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
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