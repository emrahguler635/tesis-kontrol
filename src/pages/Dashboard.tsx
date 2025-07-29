import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { BarChart3, TrendingUp, Users, Calendar, CheckCircle, Clock, AlertCircle, Activity } from 'lucide-react';
import { apiService, ControlItem } from '../services/api';

const controlTypes = [
  { key: 'Günlük', label: 'Günlük İş Programı', color: 'from-blue-500 to-blue-600', bar: 'bg-blue-500', icon: Calendar },
  { key: 'Haftalık', label: 'Haftalık Yapılan İşler', color: 'from-green-500 to-green-600', bar: 'bg-green-500', icon: Activity },
  { key: 'Aylık', label: 'Aylık Yapılan İşler', color: 'from-yellow-500 to-yellow-600', bar: 'bg-yellow-400', icon: TrendingUp },
  { key: 'Yıllık', label: 'Yıllık Yapılan İşler', color: 'from-red-500 to-red-600', bar: 'bg-red-500', icon: BarChart3 },
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
        console.error('Dashboard data fetch error:', error);
        setControlItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Durum hesaplamaları
  const getStatusCounts = () => {
    const tamamlandi = controlItems.filter(item => item.status === 'Tamamlandı').length;
    const beklemede = controlItems.filter(item => item.status === 'Beklemede').length;
    const yapilmadi = controlItems.filter(item => item.status === 'Yapılmadı').length;
    const belirsiz = controlItems.filter(item => !item.status || !['Tamamlandı', 'Beklemede', 'Yapılmadı'].includes(item.status)).length;
    
    return { tamamlandi, beklemede, yapilmadi, belirsiz };
  };

  const getPeriodCounts = () => {
    return controlTypes.map(type => ({
      ...type,
      count: controlItems.filter(item => item.period === type.key).length
    }));
  };

  const getRecentActivities = () => {
    // Son 7 günün aktivitelerini al
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return controlItems
      .filter(item => new Date(item.created_at || '') >= sevenDaysAgo)
      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
      .slice(0, 5)
      .map(item => ({
        id: item.id,
        action: `${item.title} - ${item.status || 'Durum belirsiz'}`,
        user: item.user || 'Bilinmeyen',
        time: getTimeAgo(item.created_at),
        type: getActivityType(item.status)
      }));
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Bilinmeyen';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Az önce';
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    if (diffInHours < 48) return '1 gün önce';
    return `${Math.floor(diffInHours / 24)} gün önce`;
  };

  const getActivityType = (status?: string) => {
    switch (status) {
      case 'Tamamlandı': return 'success';
      case 'Beklemede': return 'warning';
      case 'Yapılmadı': return 'error';
      default: return 'info';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Tamamlandı':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Beklemede':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'Yapılmadı':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Tamamlandı':
        return 'bg-green-100 text-green-800';
      case 'Beklemede':
        return 'bg-yellow-100 text-yellow-800';
      case 'Yapılmadı':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const statusCounts = getStatusCounts();
  const periodCounts = getPeriodCounts();
  const recentActivities = getRecentActivities();
  const uniqueUsers = [...new Set(controlItems.map(item => item.user).filter(Boolean))];

  const stats = [
    { 
      name: 'Toplam İş Kaydı', 
      value: controlItems.length, 
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    { 
      name: 'Tamamlanan', 
      value: statusCounts.tamamlandi, 
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    { 
      name: 'Bekleyen', 
      value: statusCounts.beklemede, 
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    { 
      name: 'Aktif Kullanıcı', 
      value: uniqueUsers.length, 
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Yükleniyor...</span>
      </div>
    );
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
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
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
            {periodCounts.map((type) => (
              <div key={type.key} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${type.bar} mr-3`}></div>
                  <span className="text-sm font-medium text-gray-700">{type.label}</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${type.color} text-white`}>
                  {type.count}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Status Distribution */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Durum Dağılımı</h2>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                <span className="text-sm font-medium text-gray-700">Tamamlandı</span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {statusCounts.tamamlandi}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-yellow-500 mr-3" />
                <span className="text-sm font-medium text-gray-700">Beklemede</span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {statusCounts.beklemede}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-500 mr-3" />
                <span className="text-sm font-medium text-gray-700">Yapılmadı</span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {statusCounts.yapilmadi}
              </span>
            </div>
            {statusCounts.belirsiz > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="w-4 h-4 text-gray-500 mr-3" />
                  <span className="text-sm font-medium text-gray-700">Belirsiz</span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {statusCounts.belirsiz}
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Son Aktiviteler</h2>
          <Calendar className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-4">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  {getStatusIcon(activity.type)}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.user} • {activity.time}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Henüz aktivite bulunmuyor</p>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <Calendar className="h-6 w-6 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-600">Günlük Kontrol</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <BarChart3 className="h-6 w-6 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-600">Rapor Oluştur</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <Users className="h-6 w-6 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-600">Kullanıcı Yönetimi</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
            <TrendingUp className="h-6 w-6 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-orange-600">İstatistikler</span>
          </button>
        </div>
      </Card>
    </div>
  );
} 