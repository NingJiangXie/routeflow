$ErrorActionPreference = "Continue"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$RuntimeDir = Join-Path $Root ".runtime"
$PidFiles = @(
  Join-Path $RuntimeDir "api.pid",
  Join-Path $RuntimeDir "web.pid"
)

function Write-Step($Message) {
  Write-Host "[RouteFlow] $Message"
}

foreach ($pidFile in $PidFiles) {
  if (-not (Test-Path $pidFile)) {
    continue
  }

  $processId = Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $processId) {
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    continue
  }

  $process = Get-Process -Id ([int]$processId) -ErrorAction SilentlyContinue
  if ($process) {
    Write-Step "Stopping process $processId ($($process.ProcessName))"
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
  }

  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

Write-Step "Stop command finished. If ports 5173 or 8000 are still busy, close the remaining Node/Python process manually."
