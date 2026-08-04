# Verify the SBOM Was Attached for All Images

$ACR_LOGIN_SERVER = "isc2org-axd4aja8hsb3fnhd.azurecr.io"
$REPO = "sitecore/images"

# Dynamically determine the version tag
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

# Get all images with this version
Write-Host "`nFinding images with tag version: $TAG..." -ForegroundColor Cyan
$acrImages = docker images --format "{{.Repository}}:{{.Tag}}" | 
    Select-String -Pattern "${ACR_LOGIN_SERVER}/${REPO}:" | 
    Select-String -Pattern "_${TAG}$"

if ($acrImages.Count -eq 0) {
    Write-Host "No images found with tag pattern: ${ACR_LOGIN_SERVER}/${REPO}:*_${TAG}" -ForegroundColor Yellow
    exit
}

Write-Host "Found $($acrImages.Count) image(s) to verify" -ForegroundColor Green

$successCount = 0
$failCount = 0

# Verify SBOM for each image
foreach ($image in $acrImages) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Verifying: $image" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    
    try {
        $output = oras discover --artifact-type application/spdx+json "$image" 2>&1
        Write-Host $output
        
        if ($LASTEXITCODE -eq 0 -and $output -match "application/spdx\+json") {
            Write-Host "  ✓ SBOM artifact found" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "  ⚠ No SBOM artifact found" -ForegroundColor Yellow
            $failCount++
        }
    } catch {
        Write-Host "  ✗ Error: $_" -ForegroundColor Red
        $failCount++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SBOM Verification Summary:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ SBOMs verified: $successCount" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "  ⚠ Not found: $failCount" -ForegroundColor Yellow
}
