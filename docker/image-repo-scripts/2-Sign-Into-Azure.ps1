# Sign Into Azure
# You must use an account with ACR Push/Pull permissions.

Write-Host "Signing into Azure..." -ForegroundColor Cyan
az login

# Optional if multiple subscriptions:
# az account set --subscription "<subscription-id>"

Write-Host "Azure login complete!" -ForegroundColor Green
