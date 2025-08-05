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
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      console.log('Dashboard - fetchData başladı');
      try {
        const items = await apiService.getControlItems();
        setControlItems(items);
        
        // Mesaj istatistiklerini çek
        console.log('Dashboard - Mesaj istatistikleri başlıyor');
        
        try {
          const messages = await apiService.getMessages();
          console.log('Dashboard - Mesajlar yüklendi:', messages);
          
          // Mesaj verilerinden istatistikleri hesapla
          const totalMessages = messages.length;
          const totalCount = messages.reduce((sum, msg) => sum + (msg.totalCount || msg.total_count || 0), 0);
          const pulledCount = messages.reduce((sum, msg) => sum + (msg.pulledCount || msg.pulled_count || 0), 0);
          const successRate = totalCount > 0 ? parseFloat(((pulledCount / totalCount) * 100).toFixed(1)) : 0;
          
          console.log('Dashboard - Hesaplanan istatistikler:', {
            totalMessages,
            totalCount,
            pulledCount,
            successRate
          });
          
          setMessageStats({
            totalMessages,
            pulledMessages: pulledCount,
            successRate,
            messageLog: totalMessages
          });
        } catch (error) {
          console.error('Mesaj istatistikleri alınamadı:', error);
          // Hata durumunda sıfır değerler
          setMessageStats({
            totalMessages: 0,
            pulledMessages: 0,
            successRate: 0.0,
            messageLog: 0
          });
        }
        
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

  // Responsive tasarım için dinamik sınıflar
  const getResponsiveClasses = () => {
    const { width, height } = screenSize;
    
    // Mobil
    if (width < 768) {
      return {
        container: "space-y-3",
        title: "text-xl",
        subtitle: "text-sm",
        statsGrid: "grid grid-cols-2 gap-3",
        cardHeight: "h-24",
        textSize: "text-lg",
        iconSize: "h-6 w-6",
        padding: "p-3"
      };
    }
    
    // Tablet
    if (width < 1024) {
      return {
        container: "space-y-4",
        title: "text-2xl",
        subtitle: "text-sm",
        statsGrid: "grid grid-cols-2 lg:grid-cols-4 gap-4",
        cardHeight: "h-28",
        textSize: "text-xl",
        iconSize: "h-7 w-7",
        padding: "p-4"
      };
    }
    
    // Desktop
    if (width < 1440) {
      return {
        container: "space-y-4",
        title: "text-2xl",
        subtitle: "text-base",
        statsGrid: "grid grid-cols-2 lg:grid-cols-4 gap-4",
        cardHeight: "h-32",
        textSize: "text-3xl",
        iconSize: "h-8 w-8",
        padding: "p-4"
      };
    }
    
    // Büyük ekranlar
    return {
      container: "space-y-6",
      title: "text-3xl",
      subtitle: "text-lg",
      statsGrid: "grid grid-cols-2 lg:grid-cols-4 gap-6",
      cardHeight: "h-36",
      textSize: "text-4xl",
      iconSize: "h-10 w-10",
      padding: "p-6"
    };
  };

  // Durum hesaplamaları
  const getStatusCounts = () => {
    const tamamlandi = controlItems.filter(item => item.status === 'Tamamlandı').length;
    const islemde = controlItems.filter(item => item.status === 'İşlemde').length;
    const beklemede = controlItems.filter(item => item.status === 'Beklemede').length;
    const yapilmadi = controlItems.filter(item => item.status === 'Yapılmadı').length;
    const belirsiz = controlItems.filter(item => !item.status || !['Tamamlandı', 'İşlemde', 'Beklemede', 'Yapılmadı'].includes(item.status)).length;
    
    return { tamamlandi, islemde, beklemede, yapilmadi, belirsiz };
  };

  const { tamamlandi, islemde, beklemede, yapilmadi, belirsiz } = getStatusCounts();

  const stats = [
    { name: 'Toplam İş Kaydı', value: controlItems.length, icon: BarChart3 },
    { name: 'Tamamlanan', value: tamamlandi, icon: CheckCircle },
    { name: 'Bekleyen', value: beklemede, icon: Clock },
    { name: 'İşlemde', value: islemde, icon: Activity },
  ];

  const classes = getResponsiveClasses();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <div>
        <h1 className={`font-bold text-gray-900 ${classes.title}`}>Dashboard</h1>
        <p className={`text-gray-600 ${classes.subtitle}`}>Tesis kontrol sisteminin genel durumu</p>
      </div>

      {/* İş Programı Özet Raporu */}
      <div>
        <div className="flex items-center mb-4">
          <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg mr-3">
            <BarChart3 className={`text-white ${classes.iconSize}`} />
          </div>
          <div>
            <h2 className={`font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent ${classes.title}`}>
              İş Programı Özet Raporu
            </h2>
            <p className={`text-gray-600 ${classes.subtitle}`}>Günlük iş programı istatistikleri</p>
          </div>
        </div>
        <div className={classes.statsGrid}>
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
                <div className={`flex items-center justify-between ${classes.cardHeight} ${classes.padding} ${color.bg} rounded-xl`}>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${color.text} mb-2`}>{stat.name}</p>
                    <p className={`font-bold text-white mb-1 ${classes.textSize}`}>{stat.value}</p>
                    <p className={`text-xs ${color.textLight}`}>İstatistik</p>
                  </div>
                  <div className={`p-3 ${color.iconBg} rounded-xl backdrop-blur-sm`}>
                    <stat.icon className={`text-white ${classes.iconSize}`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Mesaj Yönetimi Özeti */}
      <div>
        <div className="flex items-center mb-4">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg mr-3">
            <MessageSquare className={`text-white ${classes.iconSize}`} />
          </div>
          <div>
            <h2 className={`font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent ${classes.title}`}>
              Mesaj Yönetimi Özeti
            </h2>
            <p className={`text-gray-600 ${classes.subtitle}`}>Mesaj işlemleri ve istatistikler</p>
          </div>
        </div>
        <div className={classes.statsGrid}>
          <Card>
            <div className={`flex items-center justify-between ${classes.cardHeight} ${classes.padding} bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl`}>
              <div className="flex-1">
                <p className={`text-sm font-medium text-blue-100 mb-2`}>Toplam Mesaj</p>
                <p className={`font-bold text-white mb-1 ${classes.textSize}`}>{messageStats.totalMessages}</p>
                <p className="text-xs text-blue-200">Tüm mesajlar</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <MessageSquare className={`text-white ${classes.iconSize}`} />
              </div>
            </div>
          </Card>

          <Card>
            <div className={`flex items-center justify-between ${classes.cardHeight} ${classes.padding} bg-gradient-to-br from-green-500 to-green-600 rounded-xl`}>
              <div className="flex-1">
                <p className={`text-sm font-medium text-green-100 mb-2`}>Çekilen Mesaj</p>
                <p className={`font-bold text-white mb-1 ${classes.textSize}`}>{messageStats.pulledMessages}</p>
                <p className="text-xs text-green-200">Başarılı işlemler</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <CheckCircle className={`text-white ${classes.iconSize}`} />
              </div>
            </div>
          </Card>

          <Card>
            <div className={`flex items-center justify-between ${classes.cardHeight} ${classes.padding} bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl`}>
              <div className="flex-1">
                <p className={`text-sm font-medium text-purple-100 mb-2`}>Başarı Oranı</p>
                <p className={`font-bold text-white mb-1 ${classes.textSize}`}>{messageStats.successRate}%</p>
                <p className="text-xs text-purple-200">Performans göstergesi</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <TrendingUp className={`text-white ${classes.iconSize}`} />
              </div>
            </div>
          </Card>

          <Card>
            <div className={`flex items-center justify-between ${classes.cardHeight} ${classes.padding} bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl`}>
              <div className="flex-1">
                <p className={`text-sm font-medium text-orange-100 mb-2`}>Mesaj Log</p>
                <p className={`font-bold text-white mb-1 ${classes.textSize}`}>{messageStats.messageLog}</p>
                <p className="text-xs text-orange-200">Kayıt sayısı</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Activity className={`text-white ${classes.iconSize}`} />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* BağTV İstatistikleri */}
      <div>
        <div className="flex items-center mb-4">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg mr-3">
            <Monitor className={`text-white ${classes.iconSize}`} />
          </div>
          <div>
            <h2 className={`font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent ${classes.title}`}>
              BağTV İstatistikleri
            </h2>
            <p className={`text-gray-600 ${classes.subtitle}`}>TV sistemleri ve tesis durumları</p>
          </div>
        </div>
        <div className={classes.statsGrid}>
          <Card>
            <div className={`flex items-center justify-between ${classes.cardHeight} ${classes.padding} bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl`}>
              <div className="flex-1">
                <p className={`text-sm font-medium text-indigo-100 mb-2`}>Toplam TV</p>
                <p className={`font-bold text-white mb-1 ${classes.textSize}`}>{bagtvStats.totalTV}</p>
                <p className="text-xs text-indigo-200">Aktif TV sayısı</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Monitor className={`text-white ${classes.iconSize}`} />
              </div>
            </div>
          </Card>

          <Card>
            <div className={`flex items-center justify-between ${classes.cardHeight} ${classes.padding} bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl`}>
              <div className="flex-1">
                <p className={`text-sm font-medium text-emerald-100 mb-2`}>Aktif Tesis</p>
                <p className={`font-bold text-white mb-1 ${classes.textSize}`}>{bagtvStats.activeFacilities}</p>
                <p className="text-xs text-emerald-200">Çalışan tesis</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Building className={`text-white ${classes.iconSize}`} />
              </div>
            </div>
          </Card>

          <Card>
            <div className={`flex items-center justify-between ${classes.cardHeight} ${classes.padding} bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl`}>
              <div className="flex-1">
                <p className={`text-sm font-medium text-teal-100 mb-2`}>Toplam Tesis</p>
                <p className={`font-bold text-white mb-1 ${classes.textSize}`}>{bagtvStats.totalFacilities}</p>
                <p className="text-xs text-teal-200">Tüm tesisler</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Building className={`text-white ${classes.iconSize}`} />
              </div>
            </div>
          </Card>

          <Card>
            <div className={`flex items-center justify-between ${classes.cardHeight} ${classes.padding} bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl`}>
              <div className="flex-1">
                <p className={`text-sm font-medium text-cyan-100 mb-2`}>Ortalama TV</p>
                <p className={`font-bold text-white mb-1 ${classes.textSize}`}>{bagtvStats.averageTV}</p>
                <p className="text-xs text-cyan-200">Tesis başına</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Percent className={`text-white ${classes.iconSize}`} />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Hızlı İşlemler */}
      <div>
        <h2 className={`font-bold text-gray-900 mb-4 ${classes.title}`}>Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Günlük İş Programı</h3>
                  <p className="text-sm text-gray-600">Günlük işlerinizi yönetin</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Toplam Yapılan İşler</h3>
                  <p className="text-sm text-gray-600">Tamamlanan işleri görüntüleyin</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Mesaj Yönetimi</h3>
                  <p className="text-sm text-gray-600">Mesajlarınızı yönetin</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}; 