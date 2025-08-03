import React, { useState, useEffect } from 'react';

interface FacilityModalProps {
  open: boolean;
  onClose: () => void;
  initialName?: string;
  onSave: (name: string) => void;
}

export function FacilityModal({ open, onClose, initialName, onSave }: FacilityModalProps) {
  const [name, setName] = useState(initialName || '');

  useEffect(() => {
    if (open) setName(initialName || '');
  }, [open, initialName]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">{initialName ? 'Tesis Düzenle' : 'Yeni Tesis Ekle'}</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">Tesis Adı</label>
            <input
              className="input-field"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Tesis adı"
              autoFocus
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