$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$engine = [System.IO.Path]::GetFullPath((Join-Path $repoRoot '..\octiva-engines\SongGeneration'))
if (-not (Test-Path (Join-Path $engine '.git'))) { throw 'LeVo 2 checkout missing. Run scripts/clone-engines.ps1 first.' }
$gpuNames = @(Get-CimInstance Win32_VideoController | ForEach-Object { $_.Name })
if (-not ($gpuNames -match 'NVIDIA')) {
  throw 'BLOCKED: LeVo 2 upstream installation currently documents CUDA >=11.8. Use a verified NVIDIA/CUDA runtime or remote backend rather than faking local AMD support.'
}
if (-not $env:OCTIVA_LEVO_CKPT_PATH) { throw 'Set OCTIVA_LEVO_CKPT_PATH to the verified SongGeneration v2 checkpoint before generation.' }
Write-Host '[Octiva] LeVo 2 is command-driven; Octiva invokes adapters/levo2/wrapper.py per request.' -ForegroundColor Magenta
Write-Host "Repo: $engine"
Write-Host "Checkpoint: $env:OCTIVA_LEVO_CKPT_PATH"
