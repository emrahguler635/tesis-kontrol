import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { BarChart3, TrendingUp, Users, Calendar } from 'lucide-react';
import { apiService, ControlItem } from '../services/api';

const controlTypes = [
  { key: 'Günlük', label: 'Günlük İş Programı', color: 'from-blue-500 to-blue-600', bar: 'bg-blue-500' },
  { key: 'Haftalık', label: 'Haftalık Yapılan İşler', color: 'from-green-500 to-green-600', bar: 'bg-green-500' },
  { key: 'Aylık', label: 'Aylık Yapılan İşler', color: 'from-yellow-500 to-yellow-600', bar: 'bg-yellow-400' },
  { key: 'Yıllık', label: 'Yıllık Yapılan İşler', color: 'from-red-500 to-red-600', bar: 'bg-red-500' },
];

const recentActivities = [
  { id: 1, action: 'Günlük kontrol tamamlandı', user: 'Ahmet Yılmaz', time: '2 saat önce', type: 'success' },
  { id: 2, action: 'Haftalık rapor oluşturuldu', user: 'Mehmet Demir', time: '4 saat önce', type: 'info' },
  { id: 3, action: 'Yeni tesis eklendi', user: 'Ayşe Kaya', time: '6 saat önce', type: 'success' },
  { id: 4, action: 'Aylık kontrol başlatıldı', user: 'Fatma Öz', time: '1 gün önce', type: 'warning' },
];

export function Dashboard() {
  const [controlItems, setControlItems] = useState<ControlItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const items = await apiService.getControlItems();
        setControlItems(items);
      } catch (error) {
        setControlItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const users = [...new Set(controlItems.map(item => item.user).filter(Boolean))];
  const toplamKontrol = controlItems.length;
  const tamamlanan = controlItems.filter(item => item.workDone && item.workDone.trim() !== '').length;
  const bekleyen = controlItems.filter(item => !item.workDone || item.workDone.trim() === '').length;
  const aktifKullanici = users.length;

  const stats = [
    { name: 'Toplam Açılan İş Kaydı', value: toplamKontrol, change: '', changeType: 'positive' },
    { name: 'Tamamlanan', value: tamamlanan, change: '', changeType: 'positive' },
    { name: 'Bekleyen', value: bekleyen, change: '', changeType: 'negative' },
    { name: 'Aktif Kullanıcı', value: aktifKullanici, change: '', changeType: 'positive' },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-lg">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Tesis kontrol sisteminin genel durumu</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`flex items-center text-sm ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className="h-4 w-4 mr-1" />
                {stat.change}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Control Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Kontrol Türleri</h2>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {controlTypes.map((type) => (
              <div key={type.key} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${type.bar} mr-3`}></div>
                  <span className="text-sm font-medium text-gray-700">{type.label}</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${type.color} text-white`}>
                  {controlItems.filter(item => item.period === type.key).length}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Son Aktiviteler</h2>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'success' ? 'bg-green-500' :
                  activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">
                    {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-center">
              <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Günlük Kontrol</span>
            </div>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Rapor Oluştur</span>
            </div>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-center">
              <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Kullanıcı Yönetimi</span>
            </div>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">İstatistikler</span>
            </div>
          </button>
        </div>
      </Card>
    </div>
  );
} 