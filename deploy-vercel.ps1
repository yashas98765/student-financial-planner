#!/usr/bin/env pwsh

# Vercel Frontend Deployment Script

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Vercel Frontend Deployment Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
Write-Host "Checking for Vercel CLI..." -ForegroundColor Yellow
try {
    $vercelVersion = vercel --version 2>&1
    Write-Host "✓ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Vercel CLI not found." -ForegroundColor Red
    Write-Host "Install it globally: npm install -g vercel" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Write-Host "Quick Start:" -ForegroundColor Yellow
Write-Host "  1. Log in to Vercel:" -ForegroundColor Yellow
Write-Host "     vercel login" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Deploy frontend:" -ForegroundColor Yellow
Write-Host "     vercel --prod --cwd ./frontend" -ForegroundColor Cyan
Write-Host ""
Write-Host "  3. Set environment variable in Vercel dashboard:" -ForegroundColor Yellow
Write-Host "     REACT_APP_API_BASE = https://your-render-backend.onrender.com/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "     Then redeploy" -ForegroundColor Yellow
Write-Host ""

Write-Host "Or deploy via web:" -ForegroundColor Green
Write-Host "  1. Go to https://vercel.com/yashassh2601-gmailcoms-projects" -ForegroundColor Cyan
Write-Host "  2. Click 'Add New...' -> 'Project'" -ForegroundColor Cyan
Write-Host "  3. Select student-financial-planner repo" -ForegroundColor Cyan
Write-Host "  4. Root directory: frontend" -ForegroundColor Cyan
Write-Host "  5. Deploy and add env vars" -ForegroundColor Cyan
