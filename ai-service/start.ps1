# AI Service - Setup and Start Script
# Run from ai-service directory:
#   cd ai-service
#   .\start.ps1

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  AI Toxicity Service - Setup & Start  " -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Python
Write-Host "[1/4] Checking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "      Found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "      ERROR: Python not found. Install Python 3.9+ and add it to PATH." -ForegroundColor Red
    exit 1
}

# Step 2: Create venv if it does not exist
Write-Host "[2/4] Setting up virtual environment..." -ForegroundColor Yellow
if (-Not (Test-Path ".\venv")) {
    Write-Host "      Creating venv..." -ForegroundColor Gray
    python -m venv venv
    Write-Host "      venv created." -ForegroundColor Green
} else {
    Write-Host "      venv already exists, skipping." -ForegroundColor Green
}

# Step 3: Install dependencies
Write-Host "[3/4] Installing dependencies (first run may take several minutes)..." -ForegroundColor Yellow

# Force UTF-8 to fix encoding errors caused by Arabic characters in the project path
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"

& ".\venv\Scripts\pip.exe" install --upgrade pip --quiet

# --prefer-binary avoids compiling Rust/C extensions from source (tokenizers, etc.)
# This is necessary because Python 3.13 prebuilt wheels may not exist for all packages
& ".\venv\Scripts\pip.exe" install -r requirements.txt --prefer-binary

if ($LASTEXITCODE -ne 0) {
    Write-Host "      pip install failed. Try running with Python 3.10 or 3.11 if this persists." -ForegroundColor Red
    exit 1
}
Write-Host "      All dependencies installed." -ForegroundColor Green

# Step 4: Start the server
Write-Host "[4/4] Starting AI service on http://localhost:8001 ..." -ForegroundColor Yellow
Write-Host "      Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""

& ".\venv\Scripts\uvicorn.exe" app:app --host 0.0.0.0 --port 8001 --reload
