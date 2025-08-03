import React, { useState, useEffect } from 'react';
import { useControlStore, MessageItem } from '../store';

interface MessageModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: Partial<MessageItem>;
}

export function MessageModal({ open, onClose, initialData }: MessageModalProps) {
  const addMessage = useControlStore((s) => s.addMessage);
  const updateMessage = useControlStore((s) => s.updateMessage);

  const [totalCount, setTotalCount] = useState(initialData?.totalCount || 0);
  const [pulledCount, setPulledCount] = useState(initialData?.pulledCount || 0);
  const [description, setDescription] = useState(initialData?.description || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (open) {
      setTotalCount(initialData?.totalCount || 0);
      setPulledCount(initialData?.pulledCount || 0);
      setDescription(initialData?.description || '');
      setDate(initialData?.date || new Date().toISOString().slice(0, 10));
    }
    // eslint-disable-next-line
  }, [open, initialData]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialData && initialData.id) {
      updateMessage(initialData.id, { totalCount, pulledCount, description, date });
    } else {
      addMessage({ totalCount, pulledCount, description, date });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">{initialData?.id ? 'Düzenle' : 'Yeni Mesaj Kaydı'}</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">Mesaj Adeti</label>
            <input
              type="number"
              className="input-field"
              value={totalCount}
              onChange={(e) => setTotalCount(Number(e.target.value))}
              required
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Çekilen Mesaj Adeti</label>
            <input
              type="number"
              className="input-field"
              value={pulledCount}
              onChange={(e) => setPulledCount(Number(e.target.value))}
              required
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Açıklama</label>
            <input
              className="input-field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Açıklama"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tarih</label>
            <input
              type="date"
              className="input-field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" className="btn-secondary" onClick={onClose}>İptal</button>
            <button type="submit" className="btn-primary">Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  );
} 