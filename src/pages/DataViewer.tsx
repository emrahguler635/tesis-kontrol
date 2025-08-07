import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface DataViewerProps {}

const DataViewer: React.FC<DataViewerProps> = () => {
  const [localStorageData, setLocalStorageData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadLocalStorageData();
  }, []);

  const loadLocalStorageData = () => {
    setIsLoading(true);
    
    // localStorage'dan tüm verileri al
    const data = {
      facilities: localStorage.getItem('facilities'),
      bagtvFacilities: localStorage.getItem('bagtv-facilities'),
      controlItems: localStorage.getItem('control-items'),
      messages: localStorage.getItem('messages')
    };

    // JSON parse et
    const parsedData = {
      facilities: data.facilities ? JSON.parse(data.facilities) : [],
      bagtvFacilities: data.bagtvFacilities ? JSON.parse(data.bagtvFacilities) : [],
      controlItems: data.controlItems ? JSON.parse(data.controlItems) : [],
      messages: data.messages ? JSON.parse(data.messages) : []
    };

    setLocalStorageData(parsedData);
    setIsLoading(false);
  };

  const exportData = () => {
    const data = {
      facilities: localStorage.getItem('facilities'),
      bagtvFacilities: localStorage.getItem('bagtv-facilities'),
      controlItems: localStorage.getItem('control-items'),
      messages: localStorage.getItem('messages'),
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tesis-kontrol-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearAllData = () => {
    if (window.confirm('Tüm verileri silmek istediğinizden emin misiniz?')) {
      localStorage.removeItem('facilities');
      localStorage.removeItem('bagtv-facilities');
      localStorage.removeItem('control-items');
      localStorage.removeItem('messages');
      loadLocalStorageData();
      alert('Tüm veriler silindi!');
    }
  };

  const importToDatabase = async () => {
    try {
      const data = {
        facilities: localStorage.getItem('facilities') ? JSON.parse(localStorage.getItem('facilities')!) : [],
        bagtvFacilities: localStorage.getItem('bagtv-facilities') ? JSON.parse(localStorage.getItem('bagtv-facilities')!) : [],
        controlItems: localStorage.getItem('control-items') ? JSON.parse(localStorage.getItem('control-items')!) : [],
        messages: localStorage.getItem('messages') ? JSON.parse(localStorage.getItem('messages')!) : []
      };

      const response = await fetch('/api/import-localstorage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Veriler başarıyla database'e aktarıldı!\n\nAktarılan veriler:\n- Tesisler: ${result.imported.facilities}\n- BagTV Tesisleri: ${result.imported.bagtvFacilities}\n- Kontrol Öğeleri: ${result.imported.controlItems}\n- Mesajlar: ${result.imported.messages}`);
      } else {
        alert(`Hata: ${result.error || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Veri aktarımında hata oluştu!');
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen overflow-y-auto bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Veri Kontrol Paneli</h1>
            <div className="space-x-4">
              <button
                onClick={exportData}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Verileri Export Et
              </button>
              <button
                onClick={importToDatabase}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
              >
                Database'e Aktar
              </button>
              <button
                onClick={clearAllData}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Tüm Verileri Sil
              </button>
              <button
                onClick={loadLocalStorageData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Yenile
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tesisler */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Tesisler ({localStorageData.facilities?.length || 0})
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {localStorageData.facilities?.length > 0 ? (
                  localStorageData.facilities.map((facility: any) => (
                    <div key={facility._id} className="bg-white p-3 rounded border">
                      <div className="font-medium">{facility.name}</div>
                      <div className="text-sm text-gray-600">{facility.description}</div>
                      <div className="text-xs text-gray-500">
                        Durum: {facility.status} | Oluşturulma: {new Date(facility.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">Henüz tesis eklenmemiş</p>
                )}
              </div>
            </div>

            {/* BagTV Tesisleri */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                BagTV Tesisleri ({localStorageData.bagtvFacilities?.length || 0})
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {localStorageData.bagtvFacilities?.length > 0 ? (
                  localStorageData.bagtvFacilities.map((facility: any) => (
                    <div key={facility._id} className="bg-white p-3 rounded border">
                      <div className="font-medium">{facility.name}</div>
                      <div className="text-sm text-gray-600">{facility.description}</div>
                      <div className="text-xs text-gray-500">
                        TV Sayısı: {facility.tvCount} | Durum: {facility.status} | 
                        Oluşturulma: {new Date(facility.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">Henüz BagTV tesis eklenmemiş</p>
                )}
              </div>
            </div>

            {/* Kontrol Öğeleri */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Kontrol Öğeleri ({localStorageData.controlItems?.length || 0})
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {localStorageData.controlItems?.length > 0 ? (
                  localStorageData.controlItems.map((item: any) => (
                    <div key={item._id} className="bg-white p-3 rounded border">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-gray-600">{item.description}</div>
                      <div className="text-xs text-gray-500">
                        Periyot: {item.period} | Tarih: {item.date} | Durum: {item.status}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">Henüz kontrol öğesi eklenmemiş</p>
                )}
              </div>
            </div>

            {/* Mesajlar */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Mesajlar ({localStorageData.messages?.length || 0})
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {localStorageData.messages?.length > 0 ? (
                  localStorageData.messages.map((message: any) => (
                    <div key={message._id} className="bg-white p-3 rounded border">
                      <div className="font-medium">{message.description}</div>
                      <div className="text-sm text-gray-600">
                        Toplam: {message.totalCount} | Çekilen: {message.pulledCount}
                      </div>
                      <div className="text-xs text-gray-500">
                        Tarih: {message.date} | Hesap: {message.account}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">Henüz mesaj eklenmemiş</p>
                )}
              </div>
            </div>
          </div>

          {/* Özet Bilgiler */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2 text-blue-800">Özet Bilgiler</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Toplam Tesis:</span> {localStorageData.facilities?.length || 0}
              </div>
              <div>
                <span className="font-medium">Toplam BagTV Tesis:</span> {localStorageData.bagtvFacilities?.length || 0}
              </div>
              <div>
                <span className="font-medium">Toplam Kontrol:</span> {localStorageData.controlItems?.length || 0}
              </div>
              <div>
                <span className="font-medium">Toplam Mesaj:</span> {localStorageData.messages?.length || 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataViewer; 