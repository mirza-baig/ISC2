# Log Into ACR for ORAS

Write-Host "Logging into ACR for ORAS..." -ForegroundColor Cyan
az acr login -n isc2org-axd4aja8hsb3fnhd.azurecr.io

Write-Host "`nLogged into ACR!" -ForegroundColor Green
