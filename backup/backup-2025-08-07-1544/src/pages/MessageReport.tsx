import React, { useState } from 'react';
import { useControlStore } from '../store';
import { Card } from '../components/Card';
import { format, isWithinInterval, parseISO } from 'date-fns';

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

export function MessageReport() {
  const messages = useControlStore(s => s.messages);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Tarih filtresi uygulanmış mesajlar
  const filtered = messages.filter(msg => {
    if (!startDate && !endDate) return true;
    const date = parseISO(msg.date);
    if (startDate && endDate) {
      return isWithinInterval(date, { start: parseISO(startDate), end: parseISO(endDate) });
    }
    if (startDate) return date >= parseISO(startDate);
    if (endDate) return date <= parseISO(endDate);
    return true;
  });

  const totalMsg = filtered.reduce((sum, m) => sum + m.totalCount, 0);
  const totalPulled = filtered.reduce((sum, m) => sum + m.pulledCount, 0);
  const avgMsg = filtered.length ? (totalMsg / filtered.length).toFixed(1) : 0;
  const avgPulled = filtered.length ? (totalPulled / filtered.length).toFixed(1) : 0;
  const successRate = totalMsg ? ((totalPulled / totalMsg) * 100).toFixed(1) : 0;

  const handleExport = () => {
    const exportData = filtered.map(msg => ({
      Tarih: msg.date,
      'Mesaj Adeti': msg.totalCount,
      'Çekilen': msg.pulledCount,
      'Başarı (%)': msg.totalCount ? ((msg.pulledCount / msg.totalCount) * 100).toFixed(1) : 0,
      Açıklama: msg.description,
    }));
    exportToCSV(exportData, 'mesaj-raporu.csv');
  };

  return (
    <div className="space-y-6 h-screen overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mesaj Takip Raporu</h1>
          <p className="text-gray-600">Tarih aralığına göre özet ve detaylı mesaj çekim raporu</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span className="mx-1">-</span>
          <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <button className="btn-primary ml-4" onClick={handleExport}>CSV Dışa Aktar</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex flex-col items-center">
            <div className="text-lg font-semibold text-gray-900 mb-1">Toplam Mesaj</div>
            <div className="text-2xl font-bold text-primary-700">{totalMsg}</div>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col items-center">
            <div className="text-lg font-semibold text-gray-900 mb-1">Çekilen Mesaj</div>
            <div className="text-2xl font-bold text-primary-700">{totalPulled}</div>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col items-center">
            <div className="text-lg font-semibold text-gray-900 mb-1">Başarı Oranı</div>
            <div className="text-2xl font-bold text-green-700">%{successRate}</div>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col items-center">
            <div className="text-lg font-semibold text-gray-900 mb-1">Günlük Ortalama</div>
            <div className="text-sm text-gray-500">Mesaj: <b>{avgMsg}</b></div>
            <div className="text-sm text-gray-500">Çekilen: <b>{avgPulled}</b></div>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Detaylı Kayıtlar</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left">Tarih</th>
                <th className="px-3 py-2 text-left">Mesaj Adeti</th>
                <th className="px-3 py-2 text-left">Çekilen</th>
                <th className="px-3 py-2 text-left">Başarı (%)</th>
                <th className="px-3 py-2 text-left">Açıklama</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(msg => (
                <tr key={msg.id} className="border-b">
                  <td className="px-3 py-2">{msg.date}</td>
                  <td className="px-3 py-2">{msg.totalCount}</td>
                  <td className="px-3 py-2">{msg.pulledCount}</td>
                  <td className="px-3 py-2">{msg.totalCount ? ((msg.pulledCount / msg.totalCount) * 100).toFixed(1) : 0}</td>
                  <td className="px-3 py-2">{msg.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
} 