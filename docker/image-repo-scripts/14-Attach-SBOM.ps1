# Attach the SBOM to Images Using ORAS

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

# Get SBOM directory
$sbomDir = "sboms_$TAG"
if (!(Test-Path $sbomDir)) {
    Write-Host "SBOM directory not found: $sbomDir" -ForegroundColor Red
    Write-Host "Please run 11-Generate-SBOM.ps1 first" -ForegroundColor Yellow
    exit
}

# Get all SBOM files
$sbomFiles = Get-ChildItem -Path $sbomDir -Filter "*.spdx.json"
if ($sbomFiles.Count -eq 0) {
    Write-Host "No SBOM files found in: $sbomDir" -ForegroundColor Yellow
    exit
}

Write-Host "Found $($sbomFiles.Count) SBOM file(s) to attach" -ForegroundColor Green

$successCount = 0
$failCount = 0

# Attach each SBOM to its corresponding image
foreach ($sbomFile in $sbomFiles) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Processing: $($sbomFile.Name)" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    
    # Extract tag name from filename (remove "sbom_" prefix and ".spdx.json" suffix)
    # The BaseName already has .spdx removed, so just remove the sbom_ prefix
    $tagName = $sbomFile.Name -replace '^sbom_', '' -replace '\.spdx\.json$', ''
    $imageName = "${ACR_LOGIN_SERVER}/${REPO}:${tagName}"
    
    Write-Host "Attaching to image: $imageName" -ForegroundColor Cyan
    
    try {
        oras attach --disable-path-validation --artifact-type application/spdx+json "$imageName" $sbomFile.FullName 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ SBOM attached successfully" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "  ✗ Failed to attach SBOM" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host "  ✗ Error: $_" -ForegroundColor Red
        $failCount++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SBOM Attachment Summary:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ Successfully attached: $successCount" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "  ✗ Failed: $failCount" -ForegroundColor Red
}
Write-Host "`nSBOMs attached as OCI artifacts without modifying original images." -ForegroundColor Yellow
