import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { BarChart3, TrendingUp, Users, Calendar, CheckCircle, Clock, AlertCircle, Activity, MessageSquare, Tv } from 'lucide-react';
import { apiService, ControlItem } from '../services/api';
import { useAuthStore } from '../store';

const controlTypes = [
  { key: 'Günlük', label: 'Günlük İş Programı', color: 'from-blue-500 to-blue-600', bar: 'bg-blue-500', icon: Calendar },
  { key: 'Haftalık', label: 'Haftalık Yapılan İşler', color: 'from-green-500 to-green-600', bar: 'bg-green-500', icon: Activity },
  { key: 'Aylık', label: 'Aylık Yapılan İşler', color: 'from-yellow-500 to-yellow-600', bar: 'bg-yellow-400', icon: TrendingUp },
  { key: 'Yıllık', label: 'Yıllık Yapılan İşler', color: 'from-red-500 to-red-600', bar: 'bg-red-500', icon: BarChart3 },
];

export function Dashboard() {
  const { user } = useAuthStore();
  const [controlItems, setControlItems] = useState<ControlItem[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [bagTVFacilities, setBagTVFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [items, messagesData, bagTVData] = await Promise.all([
          apiService.getControlItems({
            userId: user?.id ? parseInt(user.id.toString()) : undefined,
            userRole: user?.role
          }),
          apiService.getMessages({
            userId: user?.id ? parseInt(user.id.toString()) : undefined,
            userRole: user?.role
          }),
          apiService.getBagTVFacilities()
        ]);
        setControlItems(items);
        setMessages(messagesData);
        setBagTVFacilities(bagTVData);
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        setControlItems([]);
        setMessages([]);
        setBagTVFacilities([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

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

  // Mesaj istatistikleri
  const getMessageStats = () => {
    const totalMessages = messages.reduce((sum, msg) => sum + (msg.totalCount || msg.total_count || 0), 0);
    const pulledMessages = messages.reduce((sum, msg) => sum + (msg.pulledCount || msg.pulled_count || 0), 0);
    const successRate = totalMessages > 0 ? ((pulledMessages / totalMessages) * 100).toFixed(1) : '0.0';
    
    return {
      totalMessages,
      pulledMessages,
      successRate: `${successRate}%`,
      messageCount: messages.length
    };
  };

  // BağTV istatistikleri
  const getBagTVStats = () => {
    const totalTVs = bagTVFacilities.reduce((sum, facility) => sum + (facility.tvCount || facility.tv_count || 0), 0);
    const activeFacilities = bagTVFacilities.filter(facility => facility.status === 'Aktif').length;
    const totalFacilities = bagTVFacilities.length;
    
    return {
      totalTVs,
      activeFacilities,
      totalFacilities,
      avgTVsPerFacility: totalFacilities > 0 ? (totalTVs / totalFacilities).toFixed(1) : '0'
    };
  };

  const statusCounts = getStatusCounts();
  const periodCounts = getPeriodCounts();
  const recentActivities = getRecentActivities();
  const uniqueUsers = [...new Set(controlItems.map(item => item.user).filter(Boolean))];
  const messageStats = getMessageStats();
  const bagTVStats = getBagTVStats();

  const stats = [
    { 
      name: 'Toplam İş Kaydı', 
      value: controlItems.length, 
      icon: BarChart3,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50'
    },
    { 
      name: 'Tamamlanan', 
      value: statusCounts.tamamlandi, 
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50'
    },
    { 
      name: 'Bekleyen', 
      value: statusCounts.beklemede, 
      icon: Clock,
      gradient: 'from-yellow-500 to-orange-500',
      bgGradient: 'from-yellow-50 to-orange-50'
    },
    { 
      name: 'Aktif Kullanıcı', 
      value: uniqueUsers.length, 
      icon: Users,
      gradient: 'from-purple-500 to-violet-500',
      bgGradient: 'from-purple-50 to-violet-50'
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
                        <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                      Yönetici Özeti
                    </h1>
                    <p className="text-gray-600">Tesis kontrol sisteminin genel durumu</p>
                  </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <div className={`bg-gradient-to-br ${stat.bgGradient} rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">{stat.name}</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">{stat.value}</p>
                </div>
                <div className={`p-4 rounded-xl bg-gradient-to-r ${stat.gradient} shadow-lg`}>
                  <stat.icon className="h-7 w-7 text-white" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

                        {/* Mesaj Yönetimi Özeti */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <div className="flex items-center justify-center mb-4">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          Mesaj Yönetimi Özeti
                        </h2>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-100 mb-2">Toplam Mesaj</p>
                              <p className="text-3xl font-bold text-white">{messageStats.totalMessages.toLocaleString()}</p>
                              <p className="text-xs text-blue-200 mt-1">Tüm mesajlar</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-xl">
                              <MessageSquare className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-100 mb-2">Çekilen Mesaj</p>
                              <p className="text-3xl font-bold text-white">{messageStats.pulledMessages.toLocaleString()}</p>
                              <p className="text-xs text-green-200 mt-1">Başarılı işlemler</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-xl">
                              <CheckCircle className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-purple-100 mb-2">Başarı Oranı</p>
                              <p className="text-3xl font-bold text-white">{messageStats.successRate}</p>
                              <p className="text-xs text-purple-200 mt-1">Performans göstergesi</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-xl">
                              <TrendingUp className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-orange-100 mb-2">Mesaj Kaydı</p>
                              <p className="text-3xl font-bold text-white">{messageStats.messageCount}</p>
                              <p className="text-xs text-orange-200 mt-1">Günlük kayıtlar</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-xl">
                              <BarChart3 className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Kontrol Türleri */}
                    <Card>
                      <div className="flex items-center justify-center mb-4">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                          Kontrol Türleri
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {periodCounts.map((type) => {
                          const totalItems = controlItems.length;
                          const percentage = totalItems > 0 ? Math.round((type.count / totalItems) * 100) : 0;
                          
                          return (
                            <div key={type.key} className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  <div className={`w-3 h-3 rounded-full ${type.bar} mr-2 shadow-sm`}></div>
                                  <span className="text-sm font-semibold text-gray-800">{type.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-600">{percentage}%</span>
                                  <div className={`px-3 py-1 rounded text-xs font-bold bg-gradient-to-r ${type.color} text-white shadow-sm`}>
                                    {type.count}
                                  </div>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                <div 
                                  className={`h-2 rounded-full bg-gradient-to-r ${type.color} shadow-sm`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-600 font-medium">
                                <span>Toplam: {type.count} iş</span>
                                <span>Oran: {percentage}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </div>

      {/* Yönetici Özet Kartları */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BağTV Özeti */}
        <Card>
          <div className="flex items-center justify-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              BağTV Özeti
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-100">Toplam TV</p>
                  <p className="text-2xl font-bold text-white">{bagTVStats.totalTVs}</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg">
                  <Tv className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-100">Aktif Tesis</p>
                  <p className="text-2xl font-bold text-white">{bagTVStats.activeFacilities}</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-cyan-100">Toplam Tesis</p>
                  <p className="text-2xl font-bold text-white">{bagTVStats.totalFacilities}</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-violet-100">Ortalama TV</p>
                  <p className="text-2xl font-bold text-white">{bagTVStats.avgTVsPerFacility}</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Durum Dağılımı */}
        <Card>
          <div className="flex items-center justify-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              Durum Dağılımı
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Tamamlandı', count: statusCounts.tamamlandi, icon: CheckCircle, color: 'green', gradient: 'from-green-500 to-emerald-500', bgColor: 'bg-green-100', textColor: 'text-green-800' },
              { label: 'Beklemede', count: statusCounts.beklemede, icon: Clock, color: 'yellow', gradient: 'from-yellow-500 to-orange-500', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
              { label: 'Yapılmadı', count: statusCounts.yapilmadi, icon: AlertCircle, color: 'red', gradient: 'from-red-500 to-pink-500', bgColor: 'bg-red-100', textColor: 'text-red-800' },
              ...(statusCounts.belirsiz > 0 ? [{ label: 'Belirsiz', count: statusCounts.belirsiz, icon: Activity, color: 'gray', gradient: 'from-gray-500 to-slate-500', bgColor: 'bg-gray-100', textColor: 'text-gray-800' }] : [])
            ].map((status) => {
              const totalItems = controlItems.length;
              const percentage = totalItems > 0 ? Math.round((status.count / totalItems) * 100) : 0;
              
              return (
                <div key={status.label} className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-r ${status.gradient} mr-2 shadow-sm`}>
                        <status.icon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{status.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-600">{percentage}%</span>
                      <div className={`px-3 py-1 rounded text-xs font-bold bg-gradient-to-r ${status.gradient} text-white shadow-sm`}>
                        {status.count}
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full bg-gradient-to-r ${status.gradient} shadow-sm`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 font-medium">
                    <span>Toplam: {status.count} iş</span>
                    <span>Oran: {percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

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