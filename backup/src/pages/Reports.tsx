import React, { useState, useEffect } from 'react'
import { Card } from '../components/Card'
import { Download, FileText, BarChart3, Calendar, FileSpreadsheet, TrendingUp, MessageSquare, Monitor, Building2, Users } from 'lucide-react'
import { apiService } from '../services/api'
import { useAuthStore } from '../store'
import * as XLSX from 'xlsx'

export function Reports() {
  const { user } = useAuthStore()
  const [controlItems, setControlItems] = useState<any[]>([])
  const [facilities, setFacilities] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [bagtvFacilities, setBagtvFacilities] = useState<any[]>([])
  const [bagtvControls, setBagtvControls] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [addingTestData, setAddingTestData] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        console.log('Raporlar veri yükleniyor...')
        console.log('Kullanıcı bilgisi:', user)
        
        // Her API çağrısını ayrı ayrı yapalım ve hataları yakalayalım
        let itemsData: any[] = []
        let facilitiesData: any[] = []
        let messagesData: any[] = []
        let bagtvFacilitiesData: any[] = []
        let bagtvControlsData: any[] = []
        let usersData: any[] = []
        
        try {
          console.log('Control items yükleniyor...')
          itemsData = await apiService.getControlItems({
            userId: user?.id ? parseInt(user.id.toString()) : undefined,
            userRole: user?.role
          })
          console.log('Control items yüklendi:', itemsData?.length || 0)
        } catch (error) {
          console.error('Control items yükleme hatası:', error)
        }
        
        try {
          console.log('Facilities yükleniyor...')
          facilitiesData = await apiService.getFacilities()
          console.log('Facilities yüklendi:', facilitiesData?.length || 0)
        } catch (error) {
          console.error('Facilities yükleme hatası:', error)
        }
        
        try {
          console.log('Messages yükleniyor...')
          messagesData = await apiService.getMessages({
            userId: user?.id ? parseInt(user.id.toString()) : undefined,
            userRole: user?.role
          })
          console.log('Messages yüklendi:', messagesData?.length || 0)
        } catch (error) {
          console.error('Messages yükleme hatası:', error)
        }
        
        try {
          console.log('BagTV facilities yükleniyor...')
          bagtvFacilitiesData = await apiService.getBagTVFacilities()
          console.log('BagTV facilities yüklendi:', bagtvFacilitiesData?.length || 0)
        } catch (error) {
          console.error('BagTV facilities yükleme hatası:', error)
        }
        
        try {
          console.log('BagTV controls yükleniyor...')
          bagtvControlsData = await apiService.getBagTVControls()
          console.log('BagTV controls yüklendi:', bagtvControlsData?.length || 0)
        } catch (error) {
          console.error('BagTV controls yükleme hatası:', error)
        }
        
        try {
          console.log('Users yükleniyor...')
          usersData = await apiService.getUsers()
          console.log('Users yüklendi:', usersData?.length || 0)
        } catch (error) {
          console.error('Users yükleme hatası:', error)
        }
        
        console.log('Tüm veriler yüklendi:', {
          controlItems: itemsData?.length || 0,
          facilities: facilitiesData?.length || 0,
          messages: messagesData?.length || 0,
          bagtvFacilities: bagtvFacilitiesData?.length || 0,
          bagtvControls: bagtvControlsData?.length || 0,
          users: usersData?.length || 0
        })
        
        setControlItems(itemsData || [])
        setFacilities(facilitiesData || [])
        setMessages(messagesData || [])
        setBagtvFacilities(bagtvFacilitiesData || [])
        setBagtvControls(bagtvControlsData || [])
        setUsers(usersData || [])
      } catch (error) {
        console.error('Raporlar genel veri yükleme hatası:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  const addTestData = async () => {
    setAddingTestData(true)
    try {
      const response = await fetch('/api/add-test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Test verisi eklendi:', result)
        alert('Test verisi başarıyla eklendi! Sayfayı yenileyin.')
        window.location.reload()
      } else {
        const error = await response.json()
        console.error('Test veri ekleme hatası:', error)
        alert('Test verisi eklenirken hata oluştu: ' + error.message)
      }
    } catch (error) {
      console.error('Test veri ekleme hatası:', error)
      alert('Test verisi eklenirken hata oluştu!')
    } finally {
      setAddingTestData(false)
    }
  }

  const exportToExcel = (period: string) => {
    console.log('Excel export başlatılıyor:', period)
    console.log('Mevcut veriler:', {
      controlItems: controlItems.length,
      facilities: facilities.length,
      messages: messages.length,
      bagtvFacilities: bagtvFacilities.length,
      bagtvControls: bagtvControls.length
    })
    
    let data: any[] = []
    let sheetName = ''
    let fileName = ''

    if (period === 'Kullanıcı') {
      // Kullanıcı performans raporu için özel format
      const userStats = controlItems.reduce((acc: any, item) => {
        const userName = item.user_name || item.user || 'Belirtilmemiş'
        if (!acc[userName]) {
          acc[userName] = {
            'Kullanıcı Adı': userName,
            'Toplam İş Sayısı': 0,
            'Tamamlanan İş': 0,
            'İşlemde Olan İş': 0,
            'Bekleyen İş': 0,
            'Yapılmamış İş': 0,
            'Tamamlanma Oranı (%)': 0,
            'Son İş Tarihi': '',
            'En Çok Çalıştığı Tesis': '',
            'Tesis Çalışma Sayısı': {}
          }
        }
        
        acc[userName]['Toplam İş Sayısı']++
        
        if (item.status === 'Tamamlandı') {
          acc[userName]['Tamamlanan İş']++
        } else if (item.status === 'İşlemde') {
          acc[userName]['İşlemde Olan İş']++
        } else if (item.status === 'Beklemede') {
          acc[userName]['Bekleyen İş']++
        } else {
          acc[userName]['Yapılmamış İş']++
        }
        
        // Son iş tarihini güncelle
        if (!acc[userName]['Son İş Tarihi'] || item.date > acc[userName]['Son İş Tarihi']) {
          acc[userName]['Son İş Tarihi'] = item.date
        }
        
        // Tesis çalışma sayısını hesapla
        const facilityName = facilities.find(f => f.id === item.facility_id)?.name || 'Bilinmiyor'
        if (!acc[userName]['Tesis Çalışma Sayısı'][facilityName]) {
          acc[userName]['Tesis Çalışma Sayısı'][facilityName] = 0
        }
        acc[userName]['Tesis Çalışma Sayısı'][facilityName]++
        
        return acc
      }, {})
      
      // Tamamlanma oranını ve en çok çalıştığı tesis bilgisini hesapla
      Object.values(userStats).forEach((user: any) => {
        if (user['Toplam İş Sayısı'] > 0) {
          user['Tamamlanma Oranı (%)'] = Math.round((user['Tamamlanan İş'] / user['Toplam İş Sayısı']) * 100)
        }
        
        // En çok çalıştığı tesis bilgisini hesapla
        const facilityCounts = user['Tesis Çalışma Sayısı']
        const maxFacility = Object.entries(facilityCounts).reduce((max: any, [name, count]: [string, any]) => {
          return count > max.count ? { name, count } : max
        }, { name: '', count: 0 })
        
        user['En Çok Çalıştığı Tesis'] = maxFacility.name || 'Veri yok'
        
        // Tesis Çalışma Sayısı alanını temizle (Excel'de göstermeye gerek yok)
        delete user['Tesis Çalışma Sayısı']
      })
      
      data = Object.values(userStats)
      sheetName = 'Kullanıcı Performans'
      fileName = `Kullanıcı_Performans_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`
    } else if (period === 'Mesaj Yönetimi') {
      // Mesaj yönetimi raporu - düzgün tablo formatında
      console.log('Mesaj Yönetimi - Orijinal messages:', messages)
      
      data = messages.map(message => {
        const row = {
          'Tarih': message.date,
          'Hesap': message.account,
          'Gönderen': message.sender || 'Belirtilmemiş',
          'Toplam Mesaj': message.totalCount || message.total_count || 0,
          'Çekilen Mesaj': message.pulledCount || message.pulled_count || 0,
          'Başarı Oranı (%)': message.totalCount && message.pulledCount 
            ? Math.round((message.pulledCount / message.totalCount) * 100) 
            : 0,
          'Açıklama': message.description || '-',
          'Oluşturulma Tarihi': message.created_at || '-'
        }
        console.log('Mesaj Yönetimi - İşlenmiş satır:', row)
        return row
      })
      
      console.log('Mesaj Yönetimi - Final data:', data)
      
      sheetName = 'Mesaj Yönetimi'
      fileName = `Mesaj_Yonetimi_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`
    } else if (period === 'BağTV Tesisleri') {
      // BağTV tesisleri raporu - düzgün tablo formatında
      data = bagtvFacilities.map(facility => ({
        'Tesis Adı': facility.name,
        'TV Adeti': facility.tvCount || facility.tv_count || 0,
        'Açıklama': facility.description || '-',
        'Durum': facility.status || 'Aktif',
        'Oluşturulma Tarihi': facility.created_at || '-'
      }))
      
      sheetName = 'BağTV Tesisleri'
      fileName = `BagTV_Tesisleri_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`
    } else if (period === 'BağTV Kontrolleri') {
      // BağTV kontrolleri raporu - düzgün tablo formatında
      data = bagtvControls.map(control => {
        const facility = bagtvFacilities.find(f => f.id === control.facilityId || f._id === control.facilityId)
        return {
          'Tesis': facility?.name || 'Bilinmiyor',
          'Tarih': control.date,
          'Yapılan İşlem': control.action,
          'Açıklama': control.description || '-',
          'Kontrol Eden': control.checkedBy,
          'Oluşturulma Tarihi': control.created_at || '-'
        }
      })
      
      sheetName = 'BağTV Kontrolleri'
      fileName = `BagTV_Kontrolleri_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`
    } else if (period === 'Genel Özet') {
      // Genel özet raporu - düzgün tablo formatında
      const totalControls = controlItems.length
      const completedControls = controlItems.filter(item => item.status === 'Tamamlandı').length
      const totalMessages = messages.length
      const totalPulledMessages = messages.reduce((sum, msg) => sum + (msg.pulledCount || msg.pulled_count || 0), 0)
      const totalBagTVFacilities = bagtvFacilities.length
      const totalBagTVControls = bagtvControls.length
      const totalUsers = users.length
      
      data = [
        {
          'Rapor Türü': 'Kontrol İşleri',
          'Toplam Kayıt': totalControls,
          'Tamamlanan': completedControls,
          'Tamamlanma Oranı (%)': totalControls > 0 ? Math.round((completedControls / totalControls) * 100) : 0,
          'Açıklama': 'Günlük, haftalık, aylık ve yıllık kontrol işleri'
        },
        {
          'Rapor Türü': 'Mesaj Yönetimi',
          'Toplam Kayıt': totalMessages,
          'Çekilen Mesaj': totalPulledMessages,
          'Başarı Oranı (%)': totalMessages > 0 ? Math.round((totalPulledMessages / (messages.reduce((sum, msg) => sum + (msg.totalCount || msg.total_count || 0), 0))) * 100) : 0,
          'Açıklama': 'Mesaj takip ve yönetim sistemi'
        },
        {
          'Rapor Türü': 'BağTV Tesisleri',
          'Toplam Kayıt': totalBagTVFacilities,
          'Toplam TV Adeti': bagtvFacilities.reduce((sum, f) => sum + (f.tvCount || f.tv_count || 0), 0),
          'Aktif Tesis': bagtvFacilities.filter(f => f.status === 'Aktif').length,
          'Açıklama': 'BağTV tesis yönetimi'
        },
        {
          'Rapor Türü': 'BağTV Kontrolleri',
          'Toplam Kayıt': totalBagTVControls,
          'Bu Ay': bagtvControls.filter(c => {
            const controlDate = new Date(c.date)
            const now = new Date()
            return controlDate.getMonth() === now.getMonth() && controlDate.getFullYear() === now.getFullYear()
          }).length,
          'Açıklama': 'BağTV kontrol geçmişi'
        },
        {
          'Rapor Türü': 'Kullanıcılar',
          'Toplam Kayıt': totalUsers,
          'Admin Kullanıcı': users.filter(u => u.role === 'admin').length,
          'Normal Kullanıcı': users.filter(u => u.role === 'user').length,
          'Açıklama': 'Sistem kullanıcıları'
        }
      ]
      
      sheetName = 'Genel Özet'
      fileName = `Genel_Ozet_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`
    } else {
      // Normal periyot raporları için - düzgün tablo formatında
      const filteredItems = controlItems.filter(item => 
        item.period === period || item.frequency === period
      )
      
      data = filteredItems.map(item => ({
        'Tesis': facilities.find(f => f.id === item.facility_id)?.name || 'Bilinmiyor',
        'Kontrol Adı': item.item_name || item.title || 'İsim belirtilmemiş',
        'Açıklama': item.description || '-',
        'Yapılan İş': item.work_done || 'Yapılmadı',
        'Tarih': item.date,
        'Periyot': item.period || item.frequency,
        'Durum': item.status || 'Belirsiz',
        'Kullanıcı': item.user_name || item.user || 'Belirtilmemiş'
      }))
      
      sheetName = `${period} Kontroller`
      fileName = `${period}_Kontrol_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`
    }

    console.log('Excel için hazırlanan veri:', {
      period,
      dataLength: data.length,
      sheetName,
      fileName,
      sampleData: data.slice(0, 2),
      dataStructure: data.length > 0 ? Object.keys(data[0]) : [],
      firstRow: data.length > 0 ? data[0] : null
    })

    // Excel worksheet oluştur - düzgün tablo formatında
    const ws = XLSX.utils.json_to_sheet(data, {
      header: Object.keys(data[0] || {}),
      skipHeader: false
    })
    
    // Sütun genişliklerini ayarla
    const colWidths: { wch: number }[] = []
    if (data.length > 0) {
      const headers = Object.keys(data[0])
      headers.forEach((header, index) => {
        // Başlık uzunluğunu hesapla
        let maxWidth = header.length
        // Veri uzunluklarını kontrol et
        data.forEach(row => {
          const cellValue = row[header]?.toString() || ''
          maxWidth = Math.max(maxWidth, cellValue.length)
        })
        // Minimum ve maksimum genişlik sınırları
        colWidths[index] = { wch: Math.min(Math.max(maxWidth + 2, 10), 50) }
      })
    }
    ws['!cols'] = colWidths

    // Excel workbook oluştur
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    
    // Excel dosyasını indir - XLSX formatında
    XLSX.writeFile(wb, fileName, {
      bookType: 'xlsx',
      bookSST: false,
      type: 'binary'
    })
    console.log('Excel dosyası oluşturuldu:', fileName)
  }

  const reports = [
    {
      id: 1,
      title: 'Günlük Kontrol Raporu',
      description: 'Günlük yapılan tüm kontrollerin detaylı raporu',
      type: 'Günlük',
      date: new Date().toISOString().split('T')[0],
      status: 'Hazır',
      count: controlItems.filter(item => item.period === 'Günlük' || item.frequency === 'Günlük').length,
      icon: Calendar,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 2,
      title: 'Haftalık Performans Raporu',
      description: 'Haftalık kontrol performansı ve istatistikler',
      type: 'Haftalık',
      date: new Date().toISOString().split('T')[0],
      status: 'Hazır',
      count: controlItems.filter(item => item.period === 'Haftalık' || item.frequency === 'Haftalık').length,
      icon: BarChart3,
      color: 'from-green-500 to-green-600'
    },
    {
      id: 3,
      title: 'Aylık Bakım Raporu',
      description: 'Aylık bakım aktiviteleri ve maliyet analizi',
      type: 'Aylık',
      date: new Date().toISOString().split('T')[0],
      status: 'Hazır',
      count: controlItems.filter(item => item.period === 'Aylık' || item.frequency === 'Aylık').length,
      icon: FileText,
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 4,
      title: 'Yıllık Denetim Raporu',
      description: 'Yıllık tesis denetimi ve uygunluk raporu',
      type: 'Yıllık',
      date: new Date().toISOString().split('T')[0],
      status: 'Hazır',
      count: controlItems.filter(item => item.period === 'Yıllık' || item.frequency === 'Yıllık').length,
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 5,
      title: 'Kullanıcı Performans Raporu',
      description: 'Kullanıcıların iş tamamlama performansı ve istatistikleri',
      type: 'Kullanıcı',
      date: new Date().toISOString().split('T')[0],
      status: 'Hazır',
      count: new Set(controlItems.map(item => item.user_name || item.user)).size,
      icon: Users,
      color: 'from-pink-500 to-pink-600'
    },
    {
      id: 6,
      title: 'Mesaj Yönetimi Raporu',
      description: 'Mesaj çekme ve yönetim performansı',
      type: 'Mesaj Yönetimi',
      date: new Date().toISOString().split('T')[0],
      status: 'Hazır',
      count: messages.length,
      icon: MessageSquare,
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      id: 7,
      title: 'BağTV Tesisleri Raporu',
      description: 'BağTV tesis yönetimi ve TV adetleri',
      type: 'BağTV Tesisleri',
      date: new Date().toISOString().split('T')[0],
      status: 'Hazır',
      count: bagtvFacilities.length,
      icon: Building2,
      color: 'from-teal-500 to-teal-600'
    },
    {
      id: 8,
      title: 'BağTV Kontrolleri Raporu',
      description: 'BağTV kontrol geçmişi ve işlemleri',
      type: 'BağTV Kontrolleri',
      date: new Date().toISOString().split('T')[0],
      status: 'Hazır',
      count: bagtvControls.length,
      icon: Monitor,
      color: 'from-cyan-500 to-cyan-600'
    },
    {
      id: 9,
      title: 'Genel Özet Raporu',
      description: 'Tüm modüllerin genel özeti ve istatistikleri',
      type: 'Genel Özet',
      date: new Date().toISOString().split('T')[0],
      status: 'Hazır',
      count: controlItems.length + messages.length + bagtvFacilities.length + bagtvControls.length,
      icon: FileSpreadsheet,
      color: 'from-gray-500 to-gray-600'
    }
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Raporlar yükleniyor...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">📊 Raporlar</h1>
        <p className="text-indigo-100 text-lg">Tesis kontrol raporları ve analizler</p>
      </div>

      {/* Test Verisi Ekleme Butonu */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">🧪 Test Verisi Ekle</h3>
            <p className="text-yellow-700 text-sm">Raporları test etmek için örnek veriler ekleyin</p>
          </div>
          <button 
            onClick={addTestData}
            disabled={addingTestData}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-200 disabled:opacity-50 font-medium"
          >
            {addingTestData ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Ekleniyor...</span>
              </>
            ) : (
              <>
                <span>🧪</span>
                <span>Test Verisi Ekle</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {reports.map((report) => (
          <div key={report.id} className="group relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${report.color} rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
            <Card className="relative bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start justify-between p-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${report.color} bg-opacity-10`}>
                      <report.icon className={`h-6 w-6 bg-gradient-to-r ${report.color} bg-clip-text text-transparent`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{report.title}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
                          {report.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {report.count} kontrol kalemi
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{report.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <FileSpreadsheet className="h-4 w-4 mr-1" />
                      Tür: {report.type}
                    </span>
                    <span>Tarih: {report.date}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    className="btn-primary flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    onClick={() => exportToExcel(report.type)}
                  >
                    <Download className="h-4 w-4" />
                    <span>Excel İndir</span>
                  </button>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {reports.map((report) => (
          <Card key={`stat-${report.id}`} className="text-center p-6">
            <div className={`w-12 h-12 bg-gradient-to-r ${report.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <report.icon className="h-6 w-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{report.count}</div>
            <div className="text-sm text-gray-500">{report.type} Kontrol</div>
          </Card>
        ))}
      </div>
    </div>
  )
} 