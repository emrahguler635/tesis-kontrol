@echo off
echo Tesis Kontrol Sistemi - Sunucular Durduruluyor...
echo.

REM Node.js süreçlerini sonlandır
echo Node.js süreçleri sonlandırılıyor...
taskkill /f /im node.exe 2>nul
taskkill /f /im nodemon.exe 2>nul

REM Vite süreçlerini sonlandır
echo Vite süreçleri sonlandırılıyor...
taskkill /f /im vite.exe 2>nul

echo.
echo Sunucular durduruldu!
echo.
pause 