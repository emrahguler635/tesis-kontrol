import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Message } from '../services/api';
import { MessageModal } from '../components/MessageModal';
import { Card } from '../components/Card';
import { Plus, Edit, Trash2, Download, Search, Calendar, MessageSquare, TrendingUp, Users, FileText, User, Hash, CheckCircle, Percent } from 'lucide-react';

// Bugünün tarihini al
function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState({
    totalMessages: 0,
    totalCount: 0,
    pulledCount: 0,
    returnCount: 0,
    successRate: 0
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMessages();
      setMessages(data);
      setFilteredMessages(data);
      
      // İstatistikleri hesapla
      const totalCount = data.reduce((sum, msg) => sum + (msg.totalCount || 0), 0);
      const pulledCount = data.reduce((sum, msg) => sum + (msg.pulledCount || 0), 0);
      const returnCount = data.reduce((sum, msg) => sum + (msg.returnCount || 0), 0);
      const successRate = totalCount > 0 ? Math.round((pulledCount / totalCount) * 100) : 0;
      
      setStats({
        totalMessages: data.length,
        totalCount,
        pulledCount,
        returnCount,
        successRate
      });
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = messages.filter(message => 
      message.account?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMessages(filtered);
  }, [searchTerm, messages]);

  const handleAddClick = () => {
    setEditItem({
      date: getTodayDate(),
      totalCount: 0,
      pulledCount: 0,
      returnCount: 0,
      description: '',
      account: '',
      sender: 'Kullanıcı'
    });
    setIsModalOpen(true);
  };

  const handleEdit = (message: Message) => {
    setEditItem(message);
    setIsModalOpen(true);
  };

  const handleSave = async (messageData: Omit<Message, 'id'>) => {
    try {
      if (editItem?.id) {
        await apiService.updateMessage(editItem.id, messageData);
      } else {
        await apiService.createMessage(messageData);
      }
      setIsModalOpen(false);
      setEditItem(null);
      fetchData();
    } catch (error) {
      console.error('Mesaj kaydedilirken hata:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bu mesajı silmek istediğinizden emin misiniz?')) {
      try {
        await apiService.deleteMessage(id);
        fetchData();
      } catch (error) {
        console.error('Mesaj silinirken hata:', error);
      }
    }
  };

  const handleChange = (field: keyof Message, value: any) => {
    if (!editItem) return;
    
    let parsedValue = value;
    if (field === 'totalCount' || field === 'pulledCount' || field === 'returnCount') {
      parsedValue = parseInt(value) || 0;
    }
    
    setEditItem({
      ...editItem,
      [field]: parsedValue
    });
  };

  const handleExport = () => {
    const headers = ['Tarih', 'Toplam Sayı', 'Çekilen Sayı', 'Geri Dönüş Sayısı', 'Hesap', 'Gönderen', 'Açıklama'];
    const csvData = messages.map(msg => [
      msg.date,
      msg.totalCount,
      msg.pulledCount,
      msg.returnCount,
      msg.account,
      msg.sender,
      msg.description || ''
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mesajlar_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 h-screen overflow-y-auto">
      {/* Dashboard Header */}
      <div className="bg-blue-600 text-white p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/20 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">Dashboard Özet Raporu</h1>
        </div>
        <p className="text-blue-100">Mesaj yönetimi ve raporlama sistemi</p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-blue-600 text-white shadow-lg">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-white/20">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-100">Toplam Mesaj</p>
              <p className="text-2xl font-bold">{stats.totalMessages}</p>
              <p className="text-xs text-blue-200">Kayıt</p>
            </div>
          </div>
        </Card>

        <Card className="bg-green-600 text-white shadow-lg">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-white/20">
              <Hash className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-100">Toplam Sayı</p>
              <p className="text-2xl font-bold">{stats.totalCount.toLocaleString()}</p>
              <p className="text-xs text-green-200">Mesaj</p>
            </div>
          </div>
        </Card>

        <Card className="bg-purple-600 text-white shadow-lg">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-white/20">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-100">Çekilen Sayı</p>
              <p className="text-2xl font-bold">{stats.pulledCount.toLocaleString()}</p>
              <p className="text-xs text-purple-200">Mesaj</p>
            </div>
          </div>
        </Card>

        <Card className="bg-orange-600 text-white shadow-lg">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-white/20">
              <Percent className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-100">Başarı Oranı</p>
              <p className="text-2xl font-bold">{stats.successRate}%</p>
              <p className="text-xs text-orange-200">Oran</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Mesaj Yönetimi Bölümü */}
      <Card>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-600 rounded-lg">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Mesaj Yönetimi</h2>
            </div>
            <p className="text-gray-600">Mesaj takip ve raporlama sistemi</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Dışa Aktar
            </button>
            <button
              onClick={handleAddClick}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              + Yeni Mesaj
            </button>
          </div>
        </div>

        {/* Arama */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Mesaj ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tablo */}
        <div className="overflow-x-auto">
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      TARİH
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    TOPLAM SAYI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    ÇEKİLEN SAYI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    GERİ DÖNÜŞ SAYISI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      HESAP
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    AÇIKLAMA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      GÖNDEREN
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    İŞLEMLER
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMessages.map((message) => (
                  <tr key={message.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(message.date).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                      {message.totalCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      {message.pulledCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-600">
                      {message.returnCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-500" />
                        {message.account}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {message.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-green-500" />
                        {message.sender}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(message)}
                          className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => message.id && handleDelete(message.id)}
                          className="p-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Boş Durum */}
        {filteredMessages.length === 0 && !loading && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz mesaj yok'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Arama kriterlerinizi değiştirmeyi deneyin'
                : 'İlk mesajınızı eklemek için "Yeni Mesaj" butonuna tıklayın'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={handleAddClick}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                İlk Mesajı Ekle
              </button>
            )}
          </div>
        )}
      </Card>

      <MessageModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditItem(null);
        }}
        onSave={handleSave}
        editItem={editItem}
        onChange={handleChange}
      />
    </div>
  );
};

export default Messages; 