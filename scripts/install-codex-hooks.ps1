$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE ".codex" }
$hooksPath = Join-Path $codexHome "hooks.json"
$hooksDir = Split-Path $hooksPath -Parent

if (-not (Test-Path $hooksDir)) {
  New-Item -ItemType Directory -Path $hooksDir -Force | Out-Null
}

$sessionStartScript = Join-Path $repoRoot ".codex\\hooks\\session-start.ps1"
$stopScript = Join-Path $repoRoot ".codex\\hooks\\stop.ps1"

$hooksConfig = [ordered]@{
  hooks = [ordered]@{
    SessionStart = @(
      [ordered]@{
        hooks = @(
          [ordered]@{
            type = "command"
            command = "powershell -NoProfile -ExecutionPolicy Bypass -File `"$sessionStartScript`""
            timeout = 15
            statusMessage = "Load Autobazar123 session context"
          }
        )
      }
    )
    Stop = @(
      [ordered]@{
        hooks = @(
          [ordered]@{
            type = "command"
            command = "powershell -NoProfile -ExecutionPolicy Bypass -File `"$stopScript`""
            timeout = 15
            statusMessage = "Run Autobazar123 stop reminder"
          }
        )
      }
    )
  }
}

$hooksJson = $hooksConfig | ConvertTo-Json -Depth 8
[System.IO.File]::WriteAllText($hooksPath, $hooksJson + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))

Write-Output "Installed Codex hooks registry to $hooksPath"
Write-Output "If needed, ensure [features] codex_hooks = true in $codexHome\\config.toml"
