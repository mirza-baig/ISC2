# Generate SBOM Using Docker Scout for All Images

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

Write-Host "Found $($acrImages.Count) image(s) for SBOM generation" -ForegroundColor Green

# Create SBOM directory if it doesn't exist
$sbomDir = "sboms_$TAG"
if (!(Test-Path $sbomDir)) {
    New-Item -ItemType Directory -Path $sbomDir | Out-Null
    Write-Host "Created directory: $sbomDir" -ForegroundColor Cyan
}

$successCount = 0
$failCount = 0

# Generate SBOM for each image
foreach ($image in $acrImages) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Processing: $image" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    
    # Extract tag name for filename
    $tagName = ($image -split ':')[1]
    Write-Host "tagName: $tagName" -ForegroundColor Yellow
    # Keep dots in the filename, only replace characters that are truly unsafe
    $safeFileName = $tagName -replace '[\\/:*?"<>|]', '_'
    Write-Host "safeFileName: $safeFileName" -ForegroundColor Yellow
    $sbomFile = "$sbomDir\sbom_$safeFileName.spdx.json"
    Write-Host "SBOM file path: $sbomFile" -ForegroundColor Yellow

    Write-Host "Generating SBOM..." -ForegroundColor Cyan
    
    try {
        docker scout sbom --format spdx $image > $sbomFile 2>&1
        
        if ($LASTEXITCODE -eq 0 -and (Test-Path $sbomFile) -and (Get-Item $sbomFile).Length -gt 0) {
            Write-Host "  ✓ SBOM generated: $sbomFile" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "  ✗ Failed to generate SBOM" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host "  ✗ Error: $_" -ForegroundColor Red
        $failCount++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SBOM Generation Summary:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ Successfully generated: $successCount" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "  ✗ Failed: $failCount" -ForegroundColor Red
}
Write-Host "`nSBOM files saved in: $sbomDir" -ForegroundColor Cyan
Write-Host "These files will be uploaded to ACR as OCI artifacts." -ForegroundColor Yellow
