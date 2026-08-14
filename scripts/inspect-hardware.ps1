$ErrorActionPreference = 'SilentlyContinue'
$report = [ordered]@{}
$report.timestamp = (Get-Date).ToString('o')
$report.os = (Get-CimInstance Win32_OperatingSystem | Select-Object Caption, Version, OSArchitecture)
$report.cpu = (Get-CimInstance Win32_Processor | Select-Object Name, NumberOfCores, NumberOfLogicalProcessors)
$report.ram_gb = [math]::Round(((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB),2)
$report.gpu = @(Get-CimInstance Win32_VideoController | Select-Object Name, DriverVersion, @{N='AdapterRAM_GB';E={[math]::Round($_.AdapterRAM/1GB,2)}})
$report.python = @(& py -0p 2>$null)
$report.git = (& git --version 2>$null)
$report.cuda = (& nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader 2>$null)
$report.rocm = (& rocminfo 2>$null | Select-Object -First 25)
$report.disk = @(Get-PSDrive -PSProvider FileSystem | Select-Object Name,@{N='FreeGB';E={[math]::Round($_.Free/1GB,2)}},@{N='UsedGB';E={[math]::Round($_.Used/1GB,2)}})

$repoRoot = Split-Path $PSScriptRoot -Parent
$out = Join-Path $repoRoot 'docs\HARDWARE_REPORT.json'
$report | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 $out
Write-Host "Hardware report written to $out" -ForegroundColor Green
Get-Content $out
