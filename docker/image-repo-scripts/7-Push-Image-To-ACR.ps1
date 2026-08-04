# Push Image to ACR

param(
    [string]$TAG = "v1"
)

$ACR_LOGIN_SERVER = "isc2org-axd4aja8hsb3fnhd.azurecr.io"
$ACR_NAME = "isc2org"
$REPO = "sitecore/images"  # Changed from docker_repo to avoid soft-delete conflicts

Write-Host "Pushing images with tag version: $TAG to ACR..." -ForegroundColor Cyan

# Get all images tagged for ACR with the specified tag (matching pattern: *_v1, *_v2, etc.)
$acrImages = docker images --format "{{.Repository}}:{{.Tag}}" | Select-String -Pattern "${ACR_LOGIN_SERVER}/${REPO}:" | Select-String -Pattern "_${TAG}$"

if ($acrImages.Count -eq 0) {
    Write-Host "No images found with tag pattern ending in: _${TAG}" -ForegroundColor Yellow
    Write-Host "Looking for: ${ACR_LOGIN_SERVER}/${REPO}:*_${TAG}" -ForegroundColor Yellow
    exit
}

Write-Host "Found $($acrImages.Count) image(s) to push:" -ForegroundColor Green
$acrImages | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }

$pushErrors = @()
$softDeleteErrors = @()

# Push each image
foreach ($image in $acrImages) {
    Write-Host "`nPushing: $image" -ForegroundColor Yellow
    
    $output = docker push $image 2>&1
    $output | Out-Host
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Pushed successfully" -ForegroundColor Green
    } else {
        # Check if it's a soft-delete issue
        if ($output -match "soft-deleted") {
            Write-Host "  ⚠ Skipping - image has soft-deleted manifest (wait 7 days or use different tag)" -ForegroundColor Yellow
            $softDeleteErrors += $image
        } else {
            Write-Host "  ✗ Failed to push" -ForegroundColor Red
            $pushErrors += $image
        }
    }
}

# Summary
$successCount = $acrImages.Count - $pushErrors.Count - $softDeleteErrors.Count
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Push Summary:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ Successfully pushed: $successCount" -ForegroundColor Green
if ($softDeleteErrors.Count -gt 0) {
    Write-Host "  ⚠ Skipped (soft-delete): $($softDeleteErrors.Count)" -ForegroundColor Yellow
}
if ($pushErrors.Count -gt 0) {
    Write-Host "  ✗ Failed: $($pushErrors.Count)" -ForegroundColor Red
}

# Verify ACR received it:
if ($successCount -gt 0) {
    Write-Host "`nVerifying ACR repository list..." -ForegroundColor Cyan
    az acr repository list -n $ACR_NAME -o table

    Write-Host "`nShowing tags for the repository..." -ForegroundColor Cyan
    az acr repository show-tags -n $ACR_NAME --repository $REPO -o table
}

if ($softDeleteErrors.Count -gt 0) {
    Write-Host "`nImages skipped due to soft-delete (wait 7 days or retag):" -ForegroundColor Yellow
    $softDeleteErrors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
}

if ($pushErrors.Count -gt 0) {
    Write-Host "`nImages that failed to push:" -ForegroundColor Red
    $pushErrors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}

if ($pushErrors.Count -eq 0 -and $softDeleteErrors.Count -eq 0) {
    Write-Host "`nAll images pushed successfully!" -ForegroundColor Green
}
