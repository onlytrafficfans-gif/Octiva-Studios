$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent

if (-not (Test-Path (Join-Path $repoRoot '.env'))) {
  Copy-Item (Join-Path $repoRoot '.env.example') (Join-Path $repoRoot '.env')
  Write-Host '[Octiva] Created .env from .env.example. Review checkpoint paths before LeVo generation.' -ForegroundColor Yellow
}

Write-Host '[Octiva] Running hardware inspection...' -ForegroundColor Cyan
& (Join-Path $PSScriptRoot 'inspect-hardware.ps1') | Out-Host

Write-Host '[Octiva] Starting ACE-Step API in a separate PowerShell...' -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit','-ExecutionPolicy','Bypass','-File',("`"" + (Join-Path $PSScriptRoot 'start-ace.ps1') + "`"")
Start-Sleep -Seconds 3

Write-Host '[Octiva] Starting Octiva Studios...' -ForegroundColor Cyan
& (Join-Path $PSScriptRoot 'start-octiva.ps1')
