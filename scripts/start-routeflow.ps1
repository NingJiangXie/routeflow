param(
  [switch]$SkipInstall,
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$RuntimeDir = Join-Path $Root ".runtime"
$ApiOutLog = Join-Path $RuntimeDir "api.out.log"
$ApiErrLog = Join-Path $RuntimeDir "api.err.log"
$WebOutLog = Join-Path $RuntimeDir "web.out.log"
$WebErrLog = Join-Path $RuntimeDir "web.err.log"
$ApiPid = Join-Path $RuntimeDir "api.pid"
$WebPid = Join-Path $RuntimeDir "web.pid"

function Write-Step($Message) {
  Write-Host "[RouteFlow] $Message"
}

function Require-Command($Name, $InstallHint) {
  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $command) {
    throw "$Name was not found. $InstallHint"
  }
  return $command.Source
}

function Test-Port($Port) {
  try {
    return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
  } catch {
    return $false
  }
}

function Ensure-FrontendDeps($Npm) {
  if ($SkipInstall -or (Test-Path (Join-Path $Root "node_modules"))) {
    return
  }
  Write-Step "Installing frontend dependencies..."
  & $Npm install
  if ($LASTEXITCODE -ne 0) {
    throw "npm install failed. Check your network or install dependencies manually."
  }
}

function Ensure-BackendDeps($Python) {
  if ($SkipInstall) {
    return
  }
  & $Python -c "import fastapi, uvicorn" *> $null
  if ($LASTEXITCODE -eq 0) {
    return
  }
  Write-Step "Installing backend dependencies..."
  & $Python -m pip install -r requirements.txt
  if ($LASTEXITCODE -ne 0) {
    throw "pip install failed. Check your Python environment or install requirements manually."
  }
}

New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null
Set-Location $Root

$Npm = Require-Command "npm.cmd" "Install Node.js 18+ and rerun this script."
$Python = Require-Command "python" "Install Python 3.10+ and rerun this script."

Ensure-FrontendDeps $Npm
Ensure-BackendDeps $Python

if (Test-Port 8000) {
  Write-Step "Backend already listening at http://127.0.0.1:8000"
} else {
  Write-Step "Starting FastAPI backend..."
  $api = Start-Process -FilePath $Python `
    -ArgumentList @("-m", "uvicorn", "api.app:app", "--reload", "--host", "127.0.0.1", "--port", "8000") `
    -WorkingDirectory $Root `
    -WindowStyle Hidden `
    -RedirectStandardOutput $ApiOutLog `
    -RedirectStandardError $ApiErrLog `
    -PassThru
  Set-Content -Encoding ASCII -Path $ApiPid -Value $api.Id
}

if (Test-Port 5173) {
  Write-Step "Frontend already listening at http://127.0.0.1:5173"
} else {
  Write-Step "Starting Vite frontend..."
  $web = Start-Process -FilePath $Npm `
    -ArgumentList @("run", "dev") `
    -WorkingDirectory $Root `
    -WindowStyle Hidden `
    -RedirectStandardOutput $WebOutLog `
    -RedirectStandardError $WebErrLog `
    -PassThru
  Set-Content -Encoding ASCII -Path $WebPid -Value $web.Id
}

Start-Sleep -Seconds 3

Write-Step "Frontend: http://127.0.0.1:5173"
Write-Step "Backend:  http://127.0.0.1:8000"
Write-Step "Logs:     $RuntimeDir"
Write-Step "Stop:     run stop-routeflow.bat"

if (-not $NoBrowser) {
  Start-Process "http://127.0.0.1:5173"
}
