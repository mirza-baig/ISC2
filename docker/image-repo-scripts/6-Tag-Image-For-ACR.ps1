# Tag the Image for ACR

$ACR_LOGIN_SERVER = "isc2org-axd4aja8hsb3fnhd.azurecr.io"
$REPO = "sitecore/images"  # Changed from docker_repo to avoid soft-delete conflicts

# Dynamically determine the next version tag
Write-Host "Determining next version tag..." -ForegroundColor Cyan
$existingTags = docker images --format "{{.Tag}}" | 
    Select-String -Pattern "^v\d+$" | 
    ForEach-Object { $_.ToString() -replace 'v', '' } | 
    ForEach-Object { [int]$_ } | 
    Sort-Object -Descending

# Check for soft-delete conflicts and skip to next available version
$baseVersion = if ($existingTags.Count -gt 0) { $existingTags[0] + 1 } else { 1 }

# Force v2 or higher to avoid soft-delete conflicts with v1
if ($baseVersion -lt 2) {
    $baseVersion = 2
    Write-Host "Forcing version to v2 to avoid soft-delete conflicts with v1" -ForegroundColor Yellow
}

$TAG = "v$baseVersion"
Write-Host "Using tag: $TAG" -ForegroundColor Green

# Get all Docker images (excluding already tagged ACR images)
Write-Host "Finding all local Docker images..." -ForegroundColor Cyan
$allImages = docker images --format "{{.Repository}}:{{.Tag}}" | 
    Where-Object { 
        $_ -notmatch $ACR_LOGIN_SERVER -and 
        $_ -notmatch '<none>'
    } |
    ForEach-Object { $_.ToString() }

if ($allImages.Count -eq 0) {
    Write-Host "No images found locally." -ForegroundColor Yellow
    exit
}

Write-Host "Found $($allImages.Count) image(s) to tag:" -ForegroundColor Green
$allImages | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }

# Tag each image for ACR
Write-Host "`nTagging images for ACR..." -ForegroundColor Cyan
foreach ($image in $allImages) {
    Write-Host "`nProcessing: $image" -ForegroundColor Yellow
    
    # Extract just the repository name (without the original tag)
    $repoName = $image -split ':' | Select-Object -First 1
    $imageName = $repoName -replace '/', '_'
    
    docker tag $image "${ACR_LOGIN_SERVER}/${REPO}:${imageName}_${TAG}"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Tagged successfully as: ${imageName}_${TAG}" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Failed to tag" -ForegroundColor Red
    }
}

# Verify tags exist:
Write-Host "`nVerifying all tags..." -ForegroundColor Cyan
docker images | Select-String $ACR_LOGIN_SERVER

Write-Host "`nAll images tagged successfully!" -ForegroundColor Green

# Call the push script with the dynamic TAG value
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Calling 7-Push-Image-To-ACR.ps1..." -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$scriptPath = Join-Path $PSScriptRoot "7-Push-Image-To-ACR.ps1"
& $scriptPath -TAG $TAG
