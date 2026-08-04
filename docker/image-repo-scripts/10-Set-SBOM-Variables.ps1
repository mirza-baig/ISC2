# Set Variables for SBOM Generation

$ACR_LOGIN_SERVER = "isc2org-axd4aja8hsb3fnhd.azurecr.io"
$ACR_NAME = "isc2org"
$REPO = "sitecore/images"

# Dynamically determine the version tag (should match what was used in tagging)
Write-Host "Determining version tag..." -ForegroundColor Cyan
$existingTags = docker images --format "{{.Tag}}" | 
    Select-String -Pattern "^v\d+$" | 
    ForEach-Object { $_.ToString() -replace 'v', '' } | 
    ForEach-Object { [int]$_ } | 
    Sort-Object -Descending

$baseVersion = if ($existingTags.Count -gt 0) { $existingTags[0] } else { 2 }
if ($baseVersion -lt 2) { $baseVersion = 2 }

$TAG = "v$baseVersion"
Write-Host "Using tag: $TAG" -ForegroundColor Green

# Get all images in ACR with this version
Write-Host "`nFinding images in ACR with tag version: $TAG..." -ForegroundColor Cyan
$acrImages = docker images --format "{{.Repository}}:{{.Tag}}" | 
    Select-String -Pattern "${ACR_LOGIN_SERVER}/${REPO}:" | 
    Select-String -Pattern "_${TAG}$"

if ($acrImages.Count -eq 0) {
    Write-Host "No images found with tag pattern: ${ACR_LOGIN_SERVER}/${REPO}:*_${TAG}" -ForegroundColor Yellow
    Write-Host "Please run 6-Tag-Image-For-ACR.ps1 first" -ForegroundColor Yellow
    exit
}

Write-Host "Found $($acrImages.Count) image(s) for SBOM generation:" -ForegroundColor Green
$acrImages | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }

Write-Host "`nSBOM Variables Set:" -ForegroundColor Green
Write-Host "  ACR_LOGIN_SERVER: $ACR_LOGIN_SERVER"
Write-Host "  ACR_NAME: $ACR_NAME"
Write-Host "  REPO: $REPO"
Write-Host "  TAG: $TAG"
Write-Host "  Images to process: $($acrImages.Count)"les for SBOM Generation

$ACR  = "isc2org-axd4aja8hsb3fnhd.azurecr.io"
$REPO = "sitecore/images"
$TAG  = "v1"
$IMG  = "${ACR}/${REPO}:${TAG}"

Write-Host "SBOM Variables Set:" -ForegroundColor Green
Write-Host "  ACR: $ACR"
Write-Host "  REPO: $REPO"
Write-Host "  TAG: $TAG"
Write-Host "  IMG: $IMG"
