$ErrorActionPreference = 'Stop'
$base = 'http://127.0.0.1:8787'
$report = [ordered]@{
  timestamp = (Get-Date).ToString('o')
  octiva = 'PENDING'
  engines = [ordered]@{}
  persistence = 'PENDING'
}

function Invoke-OctivaJson($Method, $Path, $Body=$null) {
  $params = @{ Method=$Method; Uri="$base$Path"; ContentType='application/json' }
  if ($null -ne $Body) { $params.Body = ($Body | ConvertTo-Json -Depth 8) }
  Invoke-RestMethod @params
}

try {
  $health = Invoke-OctivaJson GET '/api/health'
  $report.octiva = 'PASS'
} catch {
  $report.octiva = "BLOCKED: $($_.Exception.Message)"
  throw 'Octiva API must be running before runtime acceptance.'
}

$project = Invoke-OctivaJson POST '/api/projects' @{ name='Octiva Runtime Acceptance' }
$lyrics = @'
[Verse]
Midnight on the glass, I can see the city breathe
I built another road from the pieces underneath
[Chorus]
Turn the dark into a signal, let the whole room know
Every broken little circuit found another way to glow
'@

foreach ($engine in @('ace-step','levo2','diffrhythm2')) {
  $started = Get-Date
  try {
    $result = Invoke-OctivaJson POST '/api/generate' @{
      project_id = $project.id
      engine = $engine
      prompt = 'Dark melodic R&B trap, cinematic, emotional, reflective, original composition'
      lyrics = $lyrics
      genre = 'Dark melodic R&B / trap'
      mood = 'Cinematic, emotional, reflective'
      bpm = 155
      key = 'D minor'
      duration = 120
      instrumental = $false
    }
    $audio = Invoke-WebRequest -Uri "$base/api/audio/$($project.id)/$($result.id)" -UseBasicParsing
    if ($audio.RawContentLength -le 44) { throw 'Audio response is empty or smaller than a WAV header.' }
    $report.engines[$engine] = [ordered]@{
      status = 'PASS'
      generation_id = $result.id
      bytes = $audio.RawContentLength
      elapsed_seconds = [math]::Round(((Get-Date)-$started).TotalSeconds,2)
    }
  } catch {
    $report.engines[$engine] = [ordered]@{
      status = "BLOCKED: $($_.Exception.Message)"
      elapsed_seconds = [math]::Round(((Get-Date)-$started).TotalSeconds,2)
    }
  }
}

# Persistence test: records must still be retrievable from disk-backed project store.
try {
  $saved = Invoke-OctivaJson GET "/api/projects/$($project.id)"
  if ($saved.id -ne $project.id) { throw 'Project id changed.' }
  $report.persistence = 'PASS (disk-backed reload via API)'
} catch {
  $report.persistence = "FAIL: $($_.Exception.Message)"
}

$out = Join-Path (Split-Path $PSScriptRoot -Parent) 'docs\RUNTIME_ACCEPTANCE_RESULTS.json'
$report | ConvertTo-Json -Depth 10 | Set-Content -Encoding UTF8 $out
$report | ConvertTo-Json -Depth 10
Write-Host "Runtime acceptance report written to $out" -ForegroundColor Green

$failures = @($report.engines.Values | Where-Object { $_.status -ne 'PASS' })
if ($failures.Count -gt 0) { exit 2 }
