import React from 'react'
import { Card } from '../components/Card'
import { Download, FileText, BarChart3, Calendar, FileSpreadsheet, TrendingUp } from 'lucide-react'
import { useControlStore } from '../store'
import * as XLSX from 'xlsx'

export function Reports() {
  const controlItems = useControlStore(s => s.controlItems)
  const facilities = useControlStore(s => s.facilities)

  const exportToExcel = (period: string) => {
    const filteredItems = controlItems.filter(item => item.period === period)
    
    const data = filteredItems.map(item => ({
      'Tesis': facilities.find(f => f.id === item.facilityId)?.name || 'Bilinmiyor',
      'Kontrol Adı': item.title,
      'Açıklama': item.description,
      'Yapılan İş': item.workDone || 'Yapılmadı',
      'Tarih': item.date,
      'Periyot': item.period
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `${period} Kontroller`)
    
    // Dosya adını tarihle birlikte oluştur
    const today = new Date().toISOString().split('T')[0]
    const fileName = `${period}_Kontrol_Raporu_${today}.xlsx`
    
    XLSX.writeFile(wb, fileName)
  }

  const reports = [
    {
      id: 1,
      title: 'Günlük Kontrol Raporu',
      description: 'Günlük yapılan tüm kontrollerin detaylı raporu',
      type: 'Günlük',
      date: new Date().toISOString().split('T')[0],
      status: 'Hazır',
      count: controlItems.filter(item => item.period === 'Günlük').length,
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
      count: controlItems.filter(item => item.period === 'Haftalık').length,
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
      count: controlItems.filter(item => item.period === 'Aylık').length,
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
      count: controlItems.filter(item => item.period === 'Yıllık').length,
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600'
    }
  ]

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">📊 Raporlar</h1>
        <p className="text-indigo-100 text-lg">Tesis kontrol raporları ve analizler</p>
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