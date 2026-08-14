$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
Set-Location $repo

if (-not (Test-Path '.venv')) {
  py -3.12 -m venv .venv
}
$python = Join-Path $repo '.venv\Scripts\python.exe'
& $python -m pip install --upgrade pip
& $python -m pip install -r requirements.txt

if (Test-Path '.env') {
  Get-Content '.env' | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
      $parts = $line.Split('=',2)
      [Environment]::SetEnvironmentVariable($parts[0], $parts[1], 'Process')
    }
  }
}

Write-Host '[Octiva] Starting Studios at http://127.0.0.1:8787' -ForegroundColor Magenta
& $python -m uvicorn octiva_api.server:app --host 127.0.0.1 --port 8787 --reload
