# Set Your Variables for Azure Container Registry
# Registry and image info

$ACR_NAME = "isc2org"
$ACR_LOGIN_SERVER = "isc2org-axd4aja8hsb3fnhd.azurecr.io"
$REPO = "sandbox/helloworld"
$TAG = "v1"

Write-Host "ACR Variables Set:" -ForegroundColor Green
Write-Host "  ACR_NAME: $ACR_NAME"
Write-Host "  ACR_LOGIN_SERVER: $ACR_LOGIN_SERVER"
Write-Host "  REPO: $REPO"
Write-Host "  TAG: $TAG"
