import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { apiService } from '../services/api';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'facilities' | 'messages' | 'bagtv-facilities';
  onSuccess?: () => void;
}

interface UploadResult {
  success?: boolean;
  error?: string;
  data?: any;
  id?: number;
  name?: string;
  date?: string;
  account?: string;
  tvCount?: number;
}

export function BulkUploadModal({ isOpen, onClose, type, onSuccess }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [template, setTemplate] = useState<any>(null);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const typeLabels = {
    facilities: 'Tesisler',
    messages: 'Mesaj Yönetimi',
    'bagtv-facilities': 'BağTV Tesisleri'
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsLoading(true);

    try {
      const text = await selectedFile.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const parsedData = lines.slice(1).filter(line => line.trim()).map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        
        return row;
      });

      setData(parsedData);
    } catch (error) {
      console.error('Dosya okuma hatası:', error);
      alert('Dosya okunamadı. Lütfen geçerli bir CSV dosyası seçin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (data.length === 0) {
      alert('Yüklenecek veri bulunamadı.');
      return;
    }

    setIsLoading(true);
    setResults([]);

    try {
      let response;
      
      switch (type) {
        case 'facilities':
          response = await apiService.bulkUploadFacilities(data);
          break;
        case 'messages':
          response = await apiService.bulkUploadMessages(data);
          break;
        case 'bagtv-facilities':
          response = await apiService.bulkUploadBagTVFacilities(data);
          break;
        default:
          throw new Error('Geçersiz tür');
      }

      setResults(response.results || []);
      setShowResults(true);
      
      if (response.success > 0) {
        onSuccess?.();
      }
    } catch (error) {
      console.error('Yükleme hatası:', error);
      alert('Veri yüklenirken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const templateData = await apiService.getTemplate(type);
      setTemplate(templateData);
      
      // CSV şablonu oluştur
      const headers = templateData.headers.join(',');
      const sampleData = templateData.sample.map((row: any) => 
        templateData.headers.map((header: string) => `"${row[header] || ''}"`).join(',')
      ).join('\n');
      
      const csvContent = `${headers}\n${sampleData}`;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${typeLabels[type]}_Şablon.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Şablon indirme hatası:', error);
      alert('Şablon indirilemedi.');
    }
  };

  const resetForm = () => {
    setFile(null);
    setData([]);
    setResults([]);
    setShowResults(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {typeLabels[type]} - Toplu Veri Yükleme
              </h2>
              <p className="text-gray-600">CSV dosyasından toplu veri yükleyin</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {!showResults ? (
          <div className="space-y-6">
            {/* Şablon İndirme */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Şablon İndir</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Doğru formatta veri yüklemek için önce şablonu indirin ve doldurun.
              </p>
              <button
                onClick={handleDownloadTemplate}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Şablon İndir
              </button>
            </div>

            {/* Dosya Yükleme */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {!file ? (
                <div>
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Dosya Seçin
                  </h3>
                  <p className="text-gray-600 mb-4">
                    CSV veya Excel dosyası yükleyin
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Dosya Seç
                  </button>
                </div>
              ) : (
                <div>
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {file.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {data.length} kayıt bulundu
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Değiştir
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={isLoading || data.length === 0}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Yükleniyor...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Yükle
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Veri Önizleme */}
            {data.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Veri Önizleme ({data.length} kayıt)
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded-lg overflow-hidden">
                    <thead className="bg-gray-100">
                      <tr>
                        {Object.keys(data[0] || {}).map((header) => (
                          <th key={header} className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.slice(0, 5).map((row, index) => (
                        <tr key={index} className="border-b border-gray-200">
                          {Object.values(row).map((value, i) => (
                            <td key={i} className="px-4 py-2 text-sm text-gray-900">
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.length > 5 && (
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      ... ve {data.length - 5} kayıt daha
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Sonuçlar */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Yükleme Sonuçları</h3>
              <button
                onClick={() => setShowResults(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Yeni Yükleme
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{results.length}</div>
                <div className="text-sm text-blue-600">Toplam</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {results.filter(r => r.success).length}
                </div>
                <div className="text-sm text-green-600">Başarılı</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {results.filter(r => r.error).length}
                </div>
                <div className="text-sm text-red-600">Hatalı</div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg mb-2 flex items-center gap-3 ${
                    result.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div className="flex-1">
                    {result.success ? (
                      <div className="text-sm">
                        <span className="font-medium text-green-700">
                          Başarılı: {result.name || result.account || `ID: ${result.id}`}
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm">
                        <span className="font-medium text-red-700">
                          Hata: {result.error}
                        </span>
                        {result.data && (
                          <div className="text-xs text-gray-600 mt-1">
                            Veri: {JSON.stringify(result.data)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 