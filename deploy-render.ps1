#!/usr/bin/env pwsh

# Render Blueprint Deployment Script
# This script guides you through deploying the backend to Render using CLI

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Render Backend Deployment Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Render CLI is installed
Write-Host "Checking for Render CLI..." -ForegroundColor Yellow
try {
    $renderVersion = render --version 2>&1
    Write-Host "✓ Render CLI found: $renderVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Render CLI not found. Installing..." -ForegroundColor Red
    Write-Host "Visit: https://docs.render.com/cli to install Render CLI" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or continue with GitHub/Vercel browser deployment:" -ForegroundColor Cyan
    Write-Host "  1. Go to https://dashboard.render.com/blueprints" -ForegroundColor Cyan
    Write-Host "  2. Click 'New Blueprint'" -ForegroundColor Cyan
    Write-Host "  3. Select your student-financial-planner repo" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "Environment Variables Required:" -ForegroundColor Yellow
Write-Host "  • MONGODB_URI: Your MongoDB Atlas connection string" -ForegroundColor Yellow
Write-Host "  • FRONTEND_URL: Your deployed frontend URL (optional)" -ForegroundColor Yellow
Write-Host ""

Write-Host "Starting deployment..." -ForegroundColor Green
Write-Host "Open this link in your browser to continue:" -ForegroundColor Cyan
Write-Host "https://dashboard.render.com/blueprints" -ForegroundColor Cyan
