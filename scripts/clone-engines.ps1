$ErrorActionPreference = 'Stop'
$root = Join-Path (Split-Path $PSScriptRoot -Parent) '..\octiva-engines'
$root = [System.IO.Path]::GetFullPath($root)
New-Item -ItemType Directory -Force -Path $root | Out-Null

$repos = @(
  @{ Name='ACE-Step-1.5'; Url='https://github.com/ace-step/ACE-Step-1.5.git' },
  @{ Name='SongGeneration'; Url='https://github.com/tencent-ailab/SongGeneration.git' },
  @{ Name='DiffRhythm2'; Url='https://github.com/ASLP-lab/DiffRhythm2.git' }
)

foreach ($repo in $repos) {
  $dest = Join-Path $root $repo.Name
  if (Test-Path (Join-Path $dest '.git')) {
    Write-Host "[Octiva] Updating $($repo.Name)" -ForegroundColor Cyan
    git -C $dest fetch --all --tags --prune
  } else {
    Write-Host "[Octiva] Cloning $($repo.Name)" -ForegroundColor Cyan
    git clone $repo.Url $dest
  }
  $sha = git -C $dest rev-parse HEAD
  Write-Host "$($repo.Name): $sha" -ForegroundColor Green
}
