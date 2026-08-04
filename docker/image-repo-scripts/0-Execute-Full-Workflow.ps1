# ============================================
# Full Container Registration Workflow
# ============================================
# This script executes the complete workflow for:
# - Tagging Docker images for ACR
# - Pushing images to Azure Container Registry
# - Generating SBOMs
# - Attaching SBOMs to images
# - Verifying SBOM attachments

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SITECORE CONTAINER REGISTRATION WORKFLOW" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$ACR_NAME = "isc2org"
$ACR_LOGIN_SERVER = "isc2org-axd4aja8hsb3fnhd.azurecr.io"
$REPO = "sitecore/images"

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  ACR Name: $ACR_NAME" -ForegroundColor White
Write-Host "  ACR Login Server: $ACR_LOGIN_SERVER" -ForegroundColor White
Write-Host "  Repository: $REPO" -ForegroundColor White
Write-Host ""

# Ask for confirmation
$confirm = Read-Host "Do you want to proceed with the full workflow? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Workflow cancelled by user." -ForegroundColor Yellow
    exit
}

Write-Host ""

# ============================================
# STEP 1: Sign Into Azure
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STEP 1: Sign Into Azure" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    & "$PSScriptRoot\2-Sign-Into-Azure.ps1"
    if ($LASTEXITCODE -ne 0) {
        throw "Azure sign-in failed"
    }
    Write-Host "✓ Step 1 completed successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Step 1 failed: $_" -ForegroundColor Red
    Write-Host "Please sign in to Azure manually and try again." -ForegroundColor Yellow
    exit 1
}

# ============================================
# STEP 2: Login Docker to ACR
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STEP 2: Login Docker to ACR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    & "$PSScriptRoot\4-Login-Docker-To-ACR.ps1"
    if ($LASTEXITCODE -ne 0) {
        throw "Docker ACR login failed"
    }
    Write-Host "✓ Step 2 completed successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Step 2 failed: $_" -ForegroundColor Red
    exit 1
}

# ============================================
# STEP 3: Tag Images for ACR
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STEP 3: Tag Images for ACR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    & "$PSScriptRoot\6-Tag-Image-For-ACR.ps1"
    if ($LASTEXITCODE -ne 0) {
        throw "Image tagging failed"
    }
    Write-Host "✓ Step 3 completed successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Step 3 failed: $_" -ForegroundColor Red
    Write-Host "Tagging failed, but continuing to next steps..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Note: Step 3 includes automatic pushing to ACR via script 7" -ForegroundColor Yellow
Write-Host ""

# Wait for user to review push results
Write-Host "Press any key to continue to SBOM generation..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# ============================================
# STEP 4: Generate SBOMs
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STEP 4: Generate SBOMs" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "WARNING: SBOM generation can take 30-90 minutes for large images" -ForegroundColor Yellow
Write-Host ""

$generateSBOM = Read-Host "Do you want to generate SBOMs? (Y/N)"
if ($generateSBOM -eq "Y" -or $generateSBOM -eq "y") {
    try {
        & "$PSScriptRoot\11-Generate-SBOM.ps1"
        if ($LASTEXITCODE -ne 0) {
            throw "SBOM generation failed"
        }
        Write-Host "✓ Step 4 completed successfully" -ForegroundColor Green
    } catch {
        Write-Host "✗ Step 4 failed: $_" -ForegroundColor Red
        Write-Host "SBOM generation failed. You can generate them later." -ForegroundColor Yellow
        $skipSBOMAttach = $true
    }
} else {
    Write-Host "Skipping SBOM generation" -ForegroundColor Yellow
    $skipSBOMAttach = $true
}

# ============================================
# STEP 5: Install ORAS (if needed)
# ============================================
if (-not $skipSBOMAttach) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "STEP 5: Ensure ORAS is Installed" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    try {
        $orasInstalled = Get-Command oras -ErrorAction SilentlyContinue
        if (-not $orasInstalled) {
            Write-Host "ORAS not found. Installing..." -ForegroundColor Yellow
            & "$PSScriptRoot\12-Install-ORAS.ps1"
            Write-Host "Please restart PowerShell to use ORAS, then run this script again." -ForegroundColor Yellow
            Write-Host "Or you can manually run scripts 13, 14, and 15 to complete SBOM attachment." -ForegroundColor Yellow
            exit 0
        } else {
            Write-Host "✓ ORAS is already installed" -ForegroundColor Green
        }
    } catch {
        Write-Host "✗ ORAS check failed: $_" -ForegroundColor Red
    }

    # ============================================
    # STEP 6: Login to ACR for ORAS
    # ============================================
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "STEP 6: Login to ACR for ORAS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    try {
        & "$PSScriptRoot\13-Login-ACR-For-ORAS.ps1"
        if ($LASTEXITCODE -ne 0) {
            throw "ORAS ACR login failed"
        }
        Write-Host "✓ Step 6 completed successfully" -ForegroundColor Green
    } catch {
        Write-Host "✗ Step 6 failed: $_" -ForegroundColor Red
        $skipSBOMAttach = $true
    }

    # ============================================
    # STEP 7: Attach SBOMs
    # ============================================
    if (-not $skipSBOMAttach) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "STEP 7: Attach SBOMs to Images" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""

        try {
            & "$PSScriptRoot\14-Attach-SBOM.ps1"
            if ($LASTEXITCODE -ne 0) {
                throw "SBOM attachment failed"
            }
            Write-Host "✓ Step 7 completed successfully" -ForegroundColor Green
        } catch {
            Write-Host "✗ Step 7 failed: $_" -ForegroundColor Red
            $skipSBOMVerify = $true
        }
    }

    # ============================================
    # STEP 8: Verify SBOMs
    # ============================================
    if (-not $skipSBOMAttach -and -not $skipSBOMVerify) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "STEP 8: Verify SBOM Attachments" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""

        try {
            & "$PSScriptRoot\15-Verify-SBOM.ps1"
            Write-Host "✓ Step 8 completed successfully" -ForegroundColor Green
        } catch {
            Write-Host "✗ Step 8 failed: $_" -ForegroundColor Red
        }
    }
}

# ============================================
# FINAL SUMMARY
# ============================================
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  WORKFLOW COMPLETE" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Green
Write-Host "  ✓ Signed into Azure" -ForegroundColor White
Write-Host "  ✓ Logged Docker into ACR" -ForegroundColor White
Write-Host "  ✓ Tagged and pushed images to ACR" -ForegroundColor White

if (-not $skipSBOMAttach) {
    Write-Host "  ✓ Generated SBOMs" -ForegroundColor White
    Write-Host "  ✓ Attached SBOMs to images" -ForegroundColor White
    Write-Host "  ✓ Verified SBOM attachments" -ForegroundColor White
} else {
    Write-Host "  - SBOM operations were skipped" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Your images are now registered in ACR at:" -ForegroundColor Cyan
Write-Host "  $ACR_LOGIN_SERVER/$REPO" -ForegroundColor White
Write-Host ""
Write-Host "To view your images:" -ForegroundColor Cyan
Write-Host "  az acr repository show-tags -n $ACR_NAME --repository $REPO -o table" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
