import React, { useState, useEffect } from 'react';
import { Plus, Download, BarChart3, MessageSquare, TrendingUp, CheckCircle, Calendar, Hash, User, Edit, Trash2 } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [editItem, setEditItem] = useState({
    date: '',
    totalCount: '',
    pulledCount: '',
    account: '',
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

  // Mesajları yükle
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        console.log('Fetching messages...');
        const messagesData = await apiService.getMessages();
        console.log('Messages data received:', messagesData);
        setMessages(messagesData);
      } catch (error) {
        console.error('Mesajlar yüklenirken hata:', error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
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
          description: editItem.description
        });
        setMessages([newMessage, ...messages]);
      }
      setModalOpen(false);
      setEditingId(null);
      setEditItem({ 
        date: '', 
        totalCount: '', 
        pulledCount: '', 
        account: '', 
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
      description: message.description
    });
    setModalOpen(true);
  };

  const handleExport = () => {
    exportToCSV(messages, 'mesajlar.csv');
  };

  const handleAddClick = () => {
    setEditingId(null);
    // Bugünün tarihini ve kullanıcı bilgilerini otomatik olarak ekle
    const today = new Date().toISOString().split('T')[0];
    console.log('Current user in Messages:', user);
    console.log('User username in Messages:', user?.username);
    const editItemWithUser = { 
      date: today, 
      totalCount: '', 
      pulledCount: '', 
      account: user?.username || '', 
      description: '' 
    };
    console.log('Setting edit item:', editItemWithUser);
    setEditItem(editItemWithUser);
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

  return (
    <div className="space-y-6">
      {/* Başlık ve İstatistikler */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Mesaj Yönetimi
              </h1>
              <p className="text-gray-600 mt-1">Mesaj takip ve raporlama sistemi</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Dışa Aktar
            </button>
            <button
              onClick={handleAddClick}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Yeni Mesaj
            </button>
          </div>
        </div>
      </div>

      {/* Mesaj Listesi */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Yükleniyor...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hesap
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Toplam
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Çekilen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Oluşturulma
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {messages.map(message => (
                  <tr key={message.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {message.account}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {message.date}
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
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={message.description}>
                        {message.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {message.created_at ? new Date(message.created_at).toLocaleDateString('tr-TR') : '-'}
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
                ))}
              </tbody>
            </table>
          </div>
          
          {messages.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz mesaj yok</h3>
              <p className="text-gray-500">İlk mesajınızı eklemek için yukarıdaki butonu kullanın.</p>
            </div>
          )}
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
                  Toplam Çekilecek Mesaj Sayısı
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
                  Çekilen Mesaj Sayısı
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