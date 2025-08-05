export const config = {
  API_URL: (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api',
  MONGODB_URI: (import.meta as any).env?.VITE_MONGODB_URI || 'mongodb://localhost:27017/tesis-kontrol'
}; 