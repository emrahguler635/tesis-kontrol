@echo off
echo WhatsApp Sistemi Başlatılıyor...
echo.

echo Backend başlatılıyor...
start "Backend" cmd /k "cd backend && node server-sqlite.js"

echo Frontend başlatılıyor...
start "Frontend" cmd /k "npm run dev"

echo.
echo Sistem başlatıldı!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo WhatsApp sayfasına gidin ve QR kod oluşturun.
pause 