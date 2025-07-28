import React, { useState } from 'react'
import { Card } from '../components/Card'

export function Settings() {
  // Logo yükleme için state
  const [logo, setLogo] = useState(() => localStorage.getItem('appLogo') || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadMsg, setUploadMsg] = useState('');

  // Logo seçildiğinde base64'e çevir ve state+localStorage'a kaydet
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
        localStorage.setItem('appLogo', reader.result as string);
        setUploadMsg('Logo başarıyla yüklendi!');
      };
      reader.readAsDataURL(file);
      setLogoFile(file);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-gray-600">Kullanıcı ve sistem ayarlarını buradan düzenleyebilirsiniz.</p>
      </div>
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profil Bilgileri</h2>
        <form className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
            <input type="text" className="input-field" defaultValue="Kullanıcı Adı" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input type="email" className="input-field" defaultValue="kullanici@tesis.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
            <input type="password" className="input-field" placeholder="Yeni şifre" />
          </div>
          <button type="submit" className="btn-primary">Kaydet</button>
        </form>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Logo Yükle</h2>
        <div className="space-y-3">
          <input type="file" accept="image/*" onChange={handleLogoChange} />
          {logo && (
            <div className="flex items-center gap-4 mt-2">
              <img src={logo} alt="Logo Önizleme" className="h-16 w-16 rounded shadow border" />
              <span className="text-xs text-gray-500">Yüklü Logo</span>
            </div>
          )}
          {uploadMsg && <div className="text-green-600 text-sm">{uploadMsg}</div>}
        </div>
      </Card>
    </div>
  )
} 