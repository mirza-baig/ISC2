# Test a Pull From ACR

Write-Host "Testing pull from ACR..." -ForegroundColor Cyan

# Clean up any local copies
Write-Host "`nCleaning up local image..." -ForegroundColor Yellow
docker rmi isc2org-axd4aja8hsb3fnhd.azurecr.io/sandbox/helloworld:v1 -f

# Pull again from ACR
Write-Host "`nPulling image from ACR..." -ForegroundColor Cyan
docker pull isc2org-axd4aja8hsb3fnhd.azurecr.io/sandbox/helloworld:v1

# Run the image
Write-Host "`nRunning the image..." -ForegroundColor Cyan
docker run -d -p 8080:80 --name acr-hello isc2org-axd4aja8hsb3fnhd.azurecr.io/sandbox/helloworld:v1

Write-Host "`nContainer is running!" -ForegroundColor Green
Write-Host "Open in browser: http://localhost:8080" -ForegroundColor Cyan
