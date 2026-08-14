$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$engine = [System.IO.Path]::GetFullPath((Join-Path $repoRoot '..\octiva-engines\DiffRhythm2'))
if (-not (Test-Path (Join-Path $engine '.git'))) { throw 'DiffRhythm 2 checkout missing. Run scripts/clone-engines.ps1 first.' }
if (-not (Get-Command espeak-ng -ErrorAction SilentlyContinue)) {
  throw 'BLOCKED: espeak-ng is required by DiffRhythm 2 and is not on PATH. Install the official Windows MSI and retry.'
}
Write-Host '[Octiva] DiffRhythm 2 is command-driven; Octiva invokes adapters/diffrhythm2/wrapper.py per request.' -ForegroundColor Magenta
Write-Host "Repo: $engine"
