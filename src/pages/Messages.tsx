import React, { useState, useEffect } from 'react';
import { Plus, Download, BarChart3, MessageSquare, TrendingUp, CheckCircle, Calendar, Hash, User, Edit, Trash2, Percent } from 'lucide-react';
import { apiService } from '../services/api';
import { Card } from '../components/Card';
import { useAuthStore } from '../store';

interface Message {
  id: number;
  date: string;
  totalCount?: number;
  total_count?: number;
  pulledCount?: number;
  pulled_count?: number;
  account: string;
  sender?: string;
  description: string;
  created_at?: string;
}

function exportToCSV(data: any[], filename: string) {
  if (!data.length) return;
  const header = Object.keys(data[0]);
  const rows = data.map(row => header.map(h => '"' + (row[h] ?? '') + '"').join(','));
  const csvContent = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const Messages: React.FC = () => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editItem, setEditItem] = useState({
    date: '',
    totalCount: '',
    pulledCount: '',
    account: '',
    sender: '',
    description: ''
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'report'>('list');

  // Hesap seçenekleri
  const accountOptions = [
    'Abdullah Özdemir',
    'Yasin Yıldız', 
    'Bağcılar Belediyesi'
  ];

  // Sabit gönderen listesi
  const senderOptions = [
    'Abdullah YILDIRAN',
    'Abdurrahman ERDEM', 
    'Muhammed Taha ELKONCA',
    'Emrah GÜLER'
  ];

  // Mesajları ve kullanıcıları yükle
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const messagesData = await apiService.getMessages();
        setMessages(messagesData);
        
        // Kullanıcıları da yükle
        const usersData = await apiService.getUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Veriler yüklenirken hata:', error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setEditItem({ ...editItem, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Güncelleme
        const updatedMessage = await apiService.updateMessage(editingId, {
          date: editItem.date,
          totalCount: parseInt(editItem.totalCount),
          pulledCount: parseInt(editItem.pulledCount),
          account: editItem.account,
          sender: editItem.sender,
          description: editItem.description
        });
        setMessages(messages.map(msg => msg.id === editingId ? updatedMessage : msg));
      } else {
        // Yeni ekleme
        const newMessage = await apiService.createMessage({
          date: editItem.date,
          totalCount: parseInt(editItem.totalCount),
          pulledCount: parseInt(editItem.pulledCount),
          account: editItem.account,
          sender: editItem.sender,
          description: editItem.description
        });
        setMessages([...messages, newMessage]);
      }
      setModalOpen(false);
      setEditingId(null);
      setEditItem({ 
        date: '', 
        totalCount: '', 
        pulledCount: '', 
        account: '', 
        sender: '',
        description: '' 
      });
    } catch (error) {
      console.error('Mesaj kaydedilirken hata:', error);
      alert('Mesaj kaydedilirken bir hata oluştu.');
    }
  };

  const handleEdit = (message: Message) => {
    setEditingId(message.id);
    setEditItem({
      date: message.date,
      totalCount: (message.totalCount || message.total_count || 0).toString(),
      pulledCount: (message.pulledCount || message.pulled_count || 0).toString(),
      account: message.account,
      sender: message.sender || '',
      description: message.description
    });
    setModalOpen(true);
  };

  const handleExport = () => {
    exportToCSV(messages, 'mesajlar.csv');
  };

  const handleAddClick = () => {
    setEditItem({
      date: new Date().toISOString().split('T')[0],
      totalCount: '',
      pulledCount: '',
      description: '',
      account: '',
      sender: 'admin', // Otomatik olarak admin kullanıcısı
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiService.deleteMessage(id);
      setMessages(messages.filter(msg => msg.id !== id));
    } catch (error) {
      console.error('Mesaj silinirken hata:', error);
      alert('Mesaj silinirken bir hata oluştu.');
    }
  };

  // Tarih formatını düzenle
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Belirtilmemiş';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Geçersiz Tarih';
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      return 'Geçersiz Tarih';
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Özet Raporu Başlığı */}
      <div className="flex items-center mb-6">
        <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg mr-4">
          <BarChart3 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Dashboard Özet Raporu
          </h1>
          <p className="text-gray-600 text-sm">Mesaj yönetimi ve raporlama sistemi</p>
        </div>
      </div>

      {/* Özet Rapor Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Toplam Mesaj Sayısı */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between h-40 p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
            <div className="flex-1">
              <p className="text-base font-medium text-blue-100 mb-3">Toplam Mesaj</p>
              <p className="text-4xl font-bold text-white mb-2">{messages.length}</p>
              <p className="text-sm text-blue-200">Kayıt</p>
            </div>
            <div className="p-5 bg-white/20 rounded-xl backdrop-blur-sm">
              <MessageSquare className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>

        {/* Toplam Sayı */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between h-40 p-6 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
            <div className="flex-1">
              <p className="text-base font-medium text-green-100 mb-3">Toplam Sayı</p>
              <p className="text-4xl font-bold text-white mb-2">
                {messages.reduce((sum, msg) => sum + (msg.totalCount || msg.total_count || 0), 0)}
              </p>
              <p className="text-sm text-green-200">Mesaj</p>
            </div>
            <div className="p-5 bg-white/20 rounded-xl backdrop-blur-sm">
              <Hash className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>

        {/* Çekilen Sayı */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between h-40 p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
            <div className="flex-1">
              <p className="text-base font-medium text-purple-100 mb-3">Çekilen Sayı</p>
              <p className="text-4xl font-bold text-white mb-2">
                {messages.reduce((sum, msg) => sum + (msg.pulledCount || msg.pulled_count || 0), 0)}
              </p>
              <p className="text-sm text-purple-200">Mesaj</p>
            </div>
            <div className="p-5 bg-white/20 rounded-xl backdrop-blur-sm">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>

        {/* Başarı Oranı */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between h-40 p-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
            <div className="flex-1">
              <p className="text-base font-medium text-orange-100 mb-3">Başarı Oranı</p>
              <p className="text-4xl font-bold text-white mb-2">
                {(() => {
                  const total = messages.reduce((sum, msg) => sum + (msg.totalCount || msg.total_count || 0), 0);
                  const pulled = messages.reduce((sum, msg) => sum + (msg.pulledCount || msg.pulled_count || 0), 0);
                  return total > 0 ? Math.round((pulled / total) * 100) : 0;
                })()}%
              </p>
              <p className="text-sm text-orange-200">Oran</p>
            </div>
            <div className="p-5 bg-white/20 rounded-xl backdrop-blur-sm">
              <Percent className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Mesaj Yönetimi Başlığı */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg mr-4">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
              Mesaj Yönetimi
            </h2>
            <p className="text-gray-600 text-sm">Mesaj takip ve raporlama sistemi</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Dışa Aktar
          </button>
          <button
            onClick={handleAddClick}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Yeni Mesaj
          </button>
        </div>
      </div>

      {/* Mesaj Listesi */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Yükleniyor...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Toplam Sayı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Çekilen Sayı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hesap
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gönderen
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {messages.length > 0 ? (
                  messages.map(message => (
                    <tr key={message.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(message.date)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {message.totalCount || message.total_count || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          {message.pulledCount || message.pulled_count || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                              <User className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {message.account}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={message.description}>
                          {message.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                              <User className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {message.sender || 'Belirtilmemiş'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(message)}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Düzenle"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(message.id)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center">
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz mesaj yok</h3>
                        <p className="text-gray-500">İlk mesajınızı eklemek için yukarıdaki butonu kullanın.</p>
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
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingId ? 'Mesaj Düzenle' : 'Yeni Mesaj Ekle'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tarih
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="date"
                    value={editItem.date}
                    onChange={handleChange}
                    className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Toplam Sayı
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="totalCount"
                    value={editItem.totalCount}
                    onChange={handleChange}
                    className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Çekilen Sayı
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CheckCircle className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="pulledCount"
                    value={editItem.pulledCount}
                    onChange={handleChange}
                    className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hesap
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="account"
                    value={editItem.account}
                    onChange={handleChange}
                    className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Hesap seçin</option>
                    {accountOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  name="description"
                  value={editItem.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mesaj açıklaması..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gönderen
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="sender"
                    value={editItem.sender}
                    onChange={handleChange}
                    className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Gönderen seçin</option>
                    {senderOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  {editingId ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages; 