# Cleanup Commands

Write-Host "Cleaning up ACR test resources..." -ForegroundColor Yellow

Write-Host "`nStopping container..." -ForegroundColor Cyan
docker stop acr-hello

Write-Host "Removing container..." -ForegroundColor Cyan
docker rm acr-hello

Write-Host "Running system prune..." -ForegroundColor Cyan
docker system prune -f

Write-Host "`nCleanup complete!" -ForegroundColor Green
