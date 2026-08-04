# Log Docker Into ACR
# You must be logged into both Azure and Docker Desktop.

$ACR_NAME = "isc2org"

Write-Host "Logging Docker into ACR..." -ForegroundColor Cyan
az acr login -n $ACR_NAME

Write-Host "Docker is now logged into ACR!" -ForegroundColor Green
