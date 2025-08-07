import React from 'react';
import { Message } from '../services/api';
import { X, Calendar, Hash, CheckCircle, ArrowLeftRight, User, FileText, Save, Plus } from 'lucide-react';

interface MessageModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (messageData: Omit<Message, 'id'>) => void;
  editItem: Message | null;
  onChange: (field: keyof Message, value: any) => void;
}

export const MessageModal: React.FC<MessageModalProps> = ({
  open,
  onClose,
  onSave,
  editItem,
  onChange
}) => {
  if (!open || !editItem) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editItem);
  };

  const handleInputChange = (field: keyof Message) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onChange(field, e.target.value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Plus className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold">
                {editItem.id ? 'Mesaj Düzenle' : 'Yeni Mesaj Ekle'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-blue-100 mt-2 text-sm">
            Mesaj bilgilerini doldurun ve kaydedin
          </p>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tarih */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Tarih
              </label>
              <input
                type="date"
                value={editItem.date || ''}
                onChange={handleInputChange('date')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Sayı Alanları Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Toplam Sayı */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-blue-600" />
                  Toplam Sayı
                </label>
                <input
                  type="number"
                  value={editItem.totalCount || ''}
                  onChange={handleInputChange('totalCount')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="0"
                />
              </div>

              {/* Çekilen Sayı */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Çekilen Sayı
                </label>
                <input
                  type="number"
                  value={editItem.pulledCount || ''}
                  onChange={handleInputChange('pulledCount')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="0"
                />
              </div>

              {/* Geri Dönüş Sayısı */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-purple-600" />
                  Geri Dönüş
                </label>
                <input
                  type="number"
                  value={editItem.returnCount || ''}
                  onChange={handleInputChange('returnCount')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Hesap ve Gönderen Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hesap */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-600" />
                  Hesap
                </label>
                <select
                  value={editItem.account || ''}
                  onChange={handleInputChange('account')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="">Hesap seçiniz</option>
                  <option value="Abdullah Ozdemir">Abdullah Ozdemir</option>
                  <option value="Yasin Yildiz">Yasin Yildiz</option>
                  <option value="Bagcilar Belediyesi">Bagcilar Belediyesi</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Gönderen */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-green-600" />
                  Gönderen
                </label>
                <select
                  value={editItem.sender || ''}
                  onChange={handleInputChange('sender')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="">Gönderen seçiniz</option>
                  <option value="Emrah Guler">Emrah Guler</option>
                  <option value="Abdullah Yildiran">Abdullah Yildiran</option>
                  <option value="Muhammed Taha Elkonca">Muhammed Taha Elkonca</option>
                  <option value="Abdurrahman Erdem">Abdurrahman Erdem</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Açıklama */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-600" />
                Açıklama
              </label>
              <textarea
                value={editItem.description || ''}
                onChange={handleInputChange('description')}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                placeholder="Mesaj açıklamasını buraya yazın..."
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editItem.id ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 