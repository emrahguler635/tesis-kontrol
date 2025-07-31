import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { BarChart3, TrendingUp, Users, Calendar, CheckCircle, Clock, AlertCircle, Activity, MessageSquare, Monitor, Building, Percent } from 'lucide-react';
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
  const [messageStats, setMessageStats] = useState({
    totalMessages: 0,
    pulledMessages: 0,
    successRate: 0,
    messageLog: 0
  });
  const [bagtvStats, setBagtvStats] = useState({
    totalTV: 20,
    activeFacilities: 5,
    totalFacilities: 5,
    averageTV: 4.0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const items = await apiService.getControlItems();
        setControlItems(items);
        
        // Mesaj istatistiklerini çek (gerçek API'den gelecek)
        // Şimdilik mock data kullanıyoruz
        setMessageStats({
          totalMessages: 0,
          pulledMessages: 0,
          successRate: 0.0,
          messageLog: 0
        });
        
        // BağTV istatistiklerini çek (gerçek API'den gelecek)
        setBagtvStats({
          totalTV: 20,
          activeFacilities: 5,
          totalFacilities: 5,
          averageTV: 4.0
        });
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
    console.log('Dashboard - Control Items:', controlItems);
    console.log('Dashboard - Control Items periods:', controlItems.map(item => ({ 
      id: item.id, 
      period: item.period, 
      frequency: item.frequency,
      title: item.title 
    })));
    
    return controlTypes.map(type => {
      const count = controlItems.filter(item => 
        item.period === type.key || 
        item.frequency === type.key ||
        item.period === type.label ||
        item.frequency === type.label
      ).length;
      
      console.log(`Dashboard - ${type.key} count:`, count);
      
      return {
        ...type,
        count
      };
    });
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
      name: 'Günlük İş Programında İşlemde Olan Kayıtlar', 
      value: controlItems.filter(item => 
        (item.period === 'Günlük' || 
         item.frequency === 'Günlük' ||
         item.period === 'Günlük İş Programı' ||
         item.frequency === 'Günlük İş Programı') &&
        item.status !== 'Tamamlandı' &&
        item.status !== 'Yapılmadı'
      ).length, 
      icon: Activity,
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

      {/* Mesaj Yönetimi Özeti */}
      <div>
        <div className="flex items-center mb-6">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg mr-4">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Mesaj Yönetimi Özeti
            </h2>
            <p className="text-gray-600 text-sm">Mesaj işlemleri ve istatistikler</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between h-40 p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <div className="flex-1">
                <p className="text-base font-medium text-blue-100 mb-3">Toplam Mesaj</p>
                <p className="text-4xl font-bold text-white mb-2">{messageStats.totalMessages}</p>
                <p className="text-sm text-blue-200">Tüm mesajlar</p>
              </div>
              <div className="p-5 bg-white/20 rounded-xl backdrop-blur-sm">
                <MessageSquare className="h-12 w-12 text-white" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between h-40 p-6 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <div className="flex-1">
                <p className="text-base font-medium text-green-100 mb-3">Çekilen Mesaj</p>
                <p className="text-4xl font-bold text-white mb-2">{messageStats.pulledMessages}</p>
                <p className="text-sm text-green-200">Başarılı işlemler</p>
              </div>
              <div className="p-5 bg-white/20 rounded-xl backdrop-blur-sm">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between h-40 p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <div className="flex-1">
                <p className="text-base font-medium text-purple-100 mb-3">Başarı Oranı</p>
                <p className="text-4xl font-bold text-white mb-2">{messageStats.successRate}%</p>
                <p className="text-sm text-purple-200">Performans göstergesi</p>
              </div>
              <div className="p-5 bg-white/20 rounded-xl backdrop-blur-sm">
                <TrendingUp className="h-12 w-12 text-white" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between h-40 p-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
              <div className="flex-1">
                <p className="text-base font-medium text-orange-100 mb-3">Mesaj Kaydı</p>
                <p className="text-4xl font-bold text-white mb-2">{messageStats.messageLog}</p>
                <p className="text-sm text-orange-200">Günlük kayıtlar</p>
              </div>
              <div className="p-5 bg-white/20 rounded-xl backdrop-blur-sm">
                <BarChart3 className="h-12 w-12 text-white" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* BağTV Özeti */}
      <div>
        <div className="flex items-center mb-6">
          <div className="p-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg mr-4">
            <Monitor className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
              BağTV Özeti
            </h2>
            <p className="text-gray-600 text-sm">Televizyon ve tesis yönetimi</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between h-40 p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl">
              <div className="flex-1">
                <p className="text-base font-medium text-indigo-100 mb-3">Toplam TV</p>
                <p className="text-4xl font-bold text-white mb-2">{bagtvStats.totalTV}</p>
                <p className="text-sm text-indigo-200">Tüm TV'ler</p>
              </div>
              <div className="p-5 bg-white/20 rounded-xl backdrop-blur-sm">
                <Monitor className="h-12 w-12 text-white" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between h-40 p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
              <div className="flex-1">
                <p className="text-base font-medium text-emerald-100 mb-3">Aktif Tesis</p>
                <p className="text-4xl font-bold text-white mb-2">{bagtvStats.activeFacilities}</p>
                <p className="text-sm text-emerald-200">Çalışan tesisler</p>
              </div>
              <div className="p-5 bg-white/20 rounded-xl backdrop-blur-sm">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between h-40 p-6 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl">
              <div className="flex-1">
                <p className="text-base font-medium text-cyan-100 mb-3">Toplam Tesis</p>
                <p className="text-4xl font-bold text-white mb-2">{bagtvStats.totalFacilities}</p>
                <p className="text-sm text-cyan-200">Tüm tesisler</p>
              </div>
              <div className="p-5 bg-white/20 rounded-xl backdrop-blur-sm">
                <Building className="h-12 w-12 text-white" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between h-40 p-6 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl">
              <div className="flex-1">
                <p className="text-base font-medium text-pink-100 mb-3">Ortalama TV</p>
                <p className="text-4xl font-bold text-white mb-2">{bagtvStats.averageTV}</p>
                <p className="text-sm text-pink-200">Tesis başına</p>
              </div>
              <div className="p-5 bg-white/20 rounded-xl backdrop-blur-sm">
                <Percent className="h-12 w-12 text-white" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Stats */}
      <div>
        <div className="flex items-center mb-6">
          <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg mr-4">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
              İş Programı Özet Raporu
            </h2>
            <p className="text-gray-600 text-sm">Günlük iş programı istatistikleri</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const colors = [
              { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', text: 'text-blue-100', textLight: 'text-blue-200', iconBg: 'bg-white/20' },
              { bg: 'bg-gradient-to-br from-green-500 to-green-600', text: 'text-green-100', textLight: 'text-green-200', iconBg: 'bg-white/20' },
              { bg: 'bg-gradient-to-br from-yellow-500 to-yellow-600', text: 'text-yellow-100', textLight: 'text-yellow-200', iconBg: 'bg-white/20' },
              { bg: 'bg-gradient-to-br from-purple-500 to-purple-600', text: 'text-purple-100', textLight: 'text-purple-200', iconBg: 'bg-white/20' }
            ];
            const color = colors[index];
            
            return (
              <Card key={stat.name}>
                <div className={`flex items-center justify-between h-40 p-6 ${color.bg} rounded-xl`}>
                  <div className="flex-1">
                    <p className={`text-base font-medium ${color.text} mb-3`}>{stat.name}</p>
                    <p className="text-4xl font-bold text-white mb-2">{stat.value}</p>
                    <p className={`text-sm ${color.textLight}`}>İstatistik</p>
                  </div>
                  <div className={`p-5 ${color.iconBg} rounded-xl backdrop-blur-sm`}>
                    <stat.icon className="h-12 w-12 text-white" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Control Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Kontrol Türleri</h2>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {periodCounts.map((type) => {
              const totalItems = controlItems.length;
              const percentage = totalItems > 0 ? Math.round((type.count / totalItems) * 100) : 0;
              
              return (
                <div key={type.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${type.bar} mr-3`}></div>
                      <span className="text-sm font-medium text-gray-700">{type.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{percentage}%</span>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${type.color} text-white`}>
                        {type.count}
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full bg-gradient-to-r ${type.color}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Toplam: {type.count} iş</span>
                    <span>Oran: {percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Status Distribution */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Durum Dağılımı</h2>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {[
              { label: 'Tamamlandı', count: statusCounts.tamamlandi, icon: CheckCircle, color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
              { label: 'Beklemede', count: statusCounts.beklemede, icon: Clock, color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
              { label: 'Yapılmadı', count: statusCounts.yapilmadi, icon: AlertCircle, color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
              ...(statusCounts.belirsiz > 0 ? [{ label: 'Belirsiz', count: statusCounts.belirsiz, icon: Activity, color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' }] : [])
            ].map((status) => {
              const totalItems = controlItems.length;
              const percentage = totalItems > 0 ? Math.round((status.count / totalItems) * 100) : 0;
              
              return (
                <div key={status.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <status.icon className={`w-4 h-4 text-${status.color}-500 mr-3`} />
                      <span className="text-sm font-medium text-gray-700">{status.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{percentage}%</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}>
                        {status.count}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full bg-${status.color}-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Toplam: {status.count} iş</span>
                    <span>Oran: {percentage}%</span>
                  </div>
                </div>
              );
            })}
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