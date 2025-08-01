import React, { useState, useEffect } from 'react';
import { useControlStore, Period } from '../store';
import { apiService } from '../services/api';
import { useAuthStore } from '../store';
import axios from 'axios';

interface ControlItemModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: any;
  period: Period;
}

interface Facility {
  id: number;
  name: string;
}

export function ControlItemModal({ open, onClose, initialData, period }: ControlItemModalProps) {
  const { user: currentUser } = useAuthStore();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const addControlItem = useControlStore(s => s.addControlItem);
  const updateControlItem = useControlStore(s => s.updateControlItem);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [facilityId, setFacilityId] = useState<string>('');
  const [user, setUser] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [facilitiesData, usersData] = await Promise.all([
          apiService.getFacilities(),
          apiService.getUsers()
        ]);
        setFacilities(facilitiesData);
        setUsers(usersData.map(u => u.username));
      } catch (error) {
        console.error('Veri yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      loadData();
    }
  }, [open]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setFacilityId(initialData.facilityId?.toString() || facilities[0]?.id?.toString() || '');
      setUser(initialData.user || '');
      setStatus(
        initialData.workDone && initialData.workDone.toLowerCase().includes('normal')
          ? 'Tamamlandı'
          : initialData.workDone
          ? 'Beklemede'
          : 'Yapılmadı'
      );
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
    } else {
      setTitle('');
      setDescription('');
      setFacilityId(facilities[0]?.id?.toString() || '');
      // Yeni iş eklerken mevcut kullanıcının adını otomatik olarak ayarla
      setUser(currentUser?.username || '');
      setStatus('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [initialData, facilities, currentUser]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let workDone = '';
    if (status === 'Tamamlandı') workDone = 'Her şey normal';
    else if (status === 'Beklemede') workDone = 'Beklemede';
    else workDone = '';
    if (initialData) {
      updateControlItem(initialData.id, { title, description, facilityId, user, workDone, date, period });
    } else {
      addControlItem({ title, description, facilityId, user, workDone, date, period });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative animate-in fade-in">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
          onClick={onClose}
          title="Kapat"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4 text-gray-800">{initialData ? 'Kontrolü Düzenle' : 'Yeni Kontrol Ekle'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
            <input
              type="text"
              className="input-field"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder="Kontrol başlığı"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
            <textarea
              className="input-field"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Açıklama"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tesis</label>
            <select
              className="input-field"
              value={facilityId}
              onChange={e => setFacilityId(e.target.value)}
              required
            >
              <option value="">Tesis Seçin</option>
              {facilities.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı</label>
            <select
              className="input-field"
              value={user}
              onChange={e => setUser(e.target.value)}
              required
            >
              <option value="">Kullanıcı Seçin</option>
              {users.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
            <select
              className="input-field"
              value={status}
              onChange={e => setStatus(e.target.value)}
              required
            >
              <option value="">Seçiniz</option>
              <option value="Tamamlandı">Tamamlandı</option>
              <option value="Beklemede">Beklemede</option>
              <option value="Yapılmadı">Yapılmadı</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
            <input
              type="date"
              className="input-field"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              İptal
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 