Write-Host "========================================" -ForegroundColor Green
Write-Host "    Vercel Deploy Başlatılıyor..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "1. Git değişikliklerini kontrol ediliyor..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "2. Değişiklikler commit ediliyor..." -ForegroundColor Yellow
git add .
git commit -m "Otomatik deploy - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

Write-Host ""
Write-Host "3. GitHub'a push ediliyor..." -ForegroundColor Yellow
git push origin master

Write-Host ""
Write-Host "4. Vercel'e deploy ediliyor..." -ForegroundColor Yellow
vercel --prod

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    Deploy Tamamlandı!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green 