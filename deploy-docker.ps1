#!/usr/bin/env pwsh

# Full Docker + Compose Local Deployment
# Starts MongoDB, Backend, and Frontend all locally

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Local Docker Deployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker not installed. Install from https://www.docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting full stack locally..." -ForegroundColor Green
Write-Host ""

$deployPath = "$(Get-Location)\deployment"

if (-not (Test-Path $deployPath)) {
    Write-Host "✗ deployment/ folder not found" -ForegroundColor Red
    exit 1
}

Write-Host "Starting services..." -ForegroundColor Cyan
Set-Location $deployPath
docker compose -f docker-compose.prod.yml up -d --build

Write-Host ""
Write-Host "✓ Services started!" -ForegroundColor Green
Write-Host ""
Write-Host "Check status:" -ForegroundColor Yellow
Write-Host "  docker compose -f docker-compose.prod.yml ps" -ForegroundColor Cyan
Write-Host ""
Write-Host "View logs:" -ForegroundColor Yellow
Write-Host "  docker compose -f docker-compose.prod.yml logs -f" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services running at:" -ForegroundColor Green
Write-Host "  Frontend: http://localhost" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:5001/api" -ForegroundColor Cyan
Write-Host "  MongoDB:  localhost:27017" -ForegroundColor Cyan
Write-Host ""
Write-Host "Stop services:" -ForegroundColor Yellow
Write-Host "  docker compose -f docker-compose.prod.yml down" -ForegroundColor Cyan
