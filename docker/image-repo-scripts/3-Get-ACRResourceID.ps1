# Get ACR Resource ID (Optional)

$ACR_NAME = "isc2org"

Write-Host "Getting ACR Resource ID..." -ForegroundColor Cyan
$ACR_ID = az acr show -n $ACR_NAME --query id -o tsv

Write-Host "ACR Resource ID: $ACR_ID" -ForegroundColor Green
