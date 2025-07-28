# Tesis Kontrol Sistemi

Tesis kontrol sistemi - Günlük, haftalık, aylık ve yıllık kontrol kalemleri

## 🚀 Canlı Ortama Alma

### Seçenek 1: Vercel (Önerilen)

#### 1. MongoDB Atlas Kurulumu
1. [MongoDB Atlas](https://www.mongodb.com/atlas) hesabı oluşturun
2. Yeni cluster oluşturun (ücretsiz tier)
3. Database Access'te kullanıcı oluşturun
4. Network Access'te IP whitelist'e `0.0.0.0/0` ekleyin
5. Connection string'i kopyalayın

#### 2. Vercel Deployment
```bash
# Vercel CLI kurulumu
npm i -g vercel

# Proje dizininde
vercel login
vercel

# Environment variables ayarlayın
vercel env add MONGODB_URI
vercel env add VITE_API_URL
```

#### 3. Environment Variables
Vercel dashboard'da şu environment variables'ları ayarlayın:
- `MONGODB_URI`: MongoDB Atlas connection string
- `VITE_API_URL`: Backend URL (otomatik oluşacak)

### Seçenek 2: Railway

1. [Railway](https://railway.app) hesabı oluşturun
2. GitHub repo'nuzu bağlayın
3. MongoDB service ekleyin
4. Environment variables ayarlayın

### Seçenek 3: Heroku

#### Backend Deployment
```bash
# Heroku CLI kurulumu
npm install -g heroku

# Heroku app oluşturun
heroku create your-app-name

# MongoDB addon ekleyin
heroku addons:create mongolab

# Deploy edin
git push heroku main
```

#### Frontend Deployment
```bash
# Build alın
npm run build

# Heroku'ya deploy edin
heroku buildpacks:set https://github.com/heroku/heroku-buildpack-static.git
```

## 🛠️ Geliştirme

### Gereksinimler
- Node.js 16+
- MongoDB

### Kurulum
```bash
# Bağımlılıkları yükleyin
npm install
cd backend && npm install

# Environment variables ayarlayın
cp env.example .env
```

### Çalıştırma
```bash
# Backend
cd backend && npm run dev

# Frontend (yeni terminal)
npm run dev
```

## 📁 Proje Yapısı

```
tesis-kontrol/
├── src/                 # React frontend
├── backend/             # Express backend
├── public/              # Static dosyalar
└── dist/                # Build çıktısı
```

## 🔧 Teknolojiler

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB
- **State Management**: Zustand
- **UI Components**: Lucide React

## 📝 Özellikler

- ✅ Günlük kontroller
- ✅ Haftalık kontroller  
- ✅ Aylık kontroller
- ✅ Yıllık kontroller
- ✅ Tesis yönetimi
- ✅ Raporlama
- ✅ Mesaj takibi
- ✅ Kullanıcı yönetimi

## 🌐 Canlı Demo

**GitHub Pages**: https://emrah.github.io/tesis-kontrol

## 🚀 Özellikler

- ✅ **Kontrol Kalemleri**: Günlük, haftalık, aylık, yıllık kontroller
- 🏢 **Tesis Yönetimi**: Tesis ekleme, düzenleme, silme
- 📊 **Raporlama**: Detaylı raporlar ve analizler
- 💬 **Mesaj Takibi**: Kontrol mesajları ve bildirimler
- 🔐 **Kullanıcı Yönetimi**: Güvenli giriş sistemi
- 📱 **Responsive Tasarım**: Mobil uyumlu arayüz

## 🛠️ Teknolojiler

### Frontend
- React 18 + TypeScript
- Vite (Build tool)
- Tailwind CSS (Styling)
- React Router (Routing)
- Zustand (State Management)
- React Hook Form (Form handling)

### Backend
- Node.js + Express
- MongoDB + Mongoose
- CORS enabled

## 📦 Kurulum

### Gereksinimler
- Node.js (v16+)
- MongoDB (v5+)
- npm veya yarn

### Adımlar

1. **Repository'yi klonlayın**
```bash
git clone <repository-url>
cd tesis-kontrol
```

2. **Bağımlılıkları yükleyin**
```bash
# Frontend bağımlılıkları
npm install

# Backend bağımlılıkları
cd backend
npm install
cd ..
```

3. **MongoDB'yi başlatın**
```bash
# MongoDB servisini başlatın
mongod
```

4. **Uygulamayı çalıştırın**

**Windows PowerShell için:**
```powershell
# Frontend (Terminal 1)
npm run dev

# Backend (Terminal 2)
cd backend
node server.js
```

**Linux/Mac için:**
```bash
# Frontend (Terminal 1)
npm run dev

# Backend (Terminal 2)
cd backend && node server.js
```

5. **Tarayıcıda açın**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 🚀 GitHub Pages Deployment

### Otomatik Deployment
Bu proje GitHub Pages üzerinde otomatik olarak deploy edilir. Her `main` branch'e push yapıldığında otomatik olarak güncellenir.

### Manuel Deployment
```bash
# Projeyi build edin
npm run build

# GitHub Pages'e deploy edin
npm run deploy
```

### Deployment Notları
- GitHub Pages statik hosting olduğu için backend API'si çalışmaz
- Demo versiyonunda mock data kullanılır
- Gerçek backend için ayrı bir servis (Heroku, Railway, vb.) kullanmanız gerekir

## 📁 Proje Yapısı

```
tesis-kontrol/
├── src/
│   ├── components/     # React bileşenleri
│   ├── pages/         # Sayfa bileşenleri
│   ├── services/      # API servisleri
│   ├── utils/         # Yardımcı fonksiyonlar
│   ├── store.ts       # Zustand store
│   └── App.tsx        # Ana uygulama
├── backend/
│   └── server.js      # Express server
├── public/            # Statik dosyalar
└── package.json       # Bağımlılıklar
```

## 🔧 API Endpoints

### Tesisler
- `GET /api/facilities` - Tüm tesisleri getir
- `POST /api/facilities` - Yeni tesis oluştur

### Kontrol Kalemleri
- `GET /api/control-items` - Kontrol kalemlerini getir
- `POST /api/control-items` - Yeni kontrol kalemi oluştur
- `PUT /api/control-items/:id` - Kontrol kalemi güncelle
- `DELETE /api/control-items/:id` - Kontrol kalemi sil

## 🚀 Deployment

### Frontend (GitHub Pages)
```bash
npm run build
npm run deploy
```

### Backend (Heroku/Railway)
```bash
cd backend
# Heroku için Procfile oluşturun
echo "web: node server.js" > Procfile
```

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 İletişim

Tesis Kontrol Ekibi - [email@example.com](mailto:email@example.com)

Proje Linki: [https://github.com/emrah/tesis-kontrol](https://github.com/emrah/tesis-kontrol) 

https://tesis-kontrol.vercel.app/api/facilities 