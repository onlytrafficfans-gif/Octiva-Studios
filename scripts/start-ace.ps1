$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$engine = [System.IO.Path]::GetFullPath((Join-Path $repoRoot '..\octiva-engines\ACE-Step-1.5'))
if (-not (Test-Path (Join-Path $engine '.git'))) { throw 'ACE-Step checkout missing. Run scripts/clone-engines.ps1 first.' }

$gpuNames = @(Get-CimInstance Win32_VideoController | ForEach-Object { $_.Name })
Set-Location $engine
if ($gpuNames -match 'AMD|Radeon') {
  $launcher = Join-Path $engine 'start_api_server_rocm.bat'
  if (-not (Test-Path $launcher)) { throw 'Upstream ROCm API launcher is missing.' }
  Write-Host '[Octiva] Starting ACE-Step API with upstream Windows ROCm launcher.' -ForegroundColor Magenta
  & $launcher
} elseif ($gpuNames -match 'NVIDIA') {
  $launcher = Join-Path $engine 'start_api_server.bat'
  if (-not (Test-Path $launcher)) { throw 'Upstream CUDA API launcher is missing.' }
  Write-Host '[Octiva] Starting ACE-Step API with upstream CUDA launcher.' -ForegroundColor Magenta
  & $launcher
} else {
  throw "No supported AMD/NVIDIA GPU detected for this launcher. GPUs: $($gpuNames -join ', ')"
}
