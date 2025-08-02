@echo off
echo ========================================
echo    Vercel Deploy Başlatılıyor...
echo ========================================
echo.

echo 1. Git değişikliklerini kontrol ediliyor...
git status

echo.
echo 2. Değişiklikler commit ediliyor...
git add .
git commit -m "Otomatik deploy - %date% %time%"

echo.
echo 3. GitHub'a push ediliyor...
git push origin master

echo.
echo 4. Vercel'e deploy ediliyor...
vercel --prod

echo.
echo ========================================
echo    Deploy Tamamlandı!
echo ========================================
pause 