$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\\..")).Path

function Get-GitExecutable {
  $candidates = @(
    "C:\\Program Files\\Git\\cmd\\git.exe",
    "C:\\Program Files\\Git\\bin\\git.exe"
  )

  try {
    $resolved = (Get-Command git -ErrorAction Stop).Source
    if ($resolved) {
      return $resolved
    }
  } catch {
  }

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  throw "git executable not found"
}

function Get-GitInfo {
  param(
    [string]$GitExe,
    [string]$RepositoryRoot
  )

  try {
    $branch = (& $GitExe -C $RepositoryRoot rev-parse --abbrev-ref HEAD 2>$null).Trim()
    if (-not $branch) {
      $branch = "unknown"
    }

    $statusLines = @(& $GitExe -C $RepositoryRoot status --short 2>$null)
    $staged = 0
    $modified = 0
    $untracked = 0

    foreach ($line in $statusLines) {
      if ($line.Length -lt 2) {
        continue
      }

      $indexFlag = $line[0]
      $worktreeFlag = $line[1]

      if ($line.StartsWith("??")) {
        $untracked++
        continue
      }

      if ($indexFlag -ne " ") {
        $staged++
      }

      if ($worktreeFlag -ne " ") {
        $modified++
      }
    }

    return [pscustomobject]@{
      Branch = $branch
      Staged = $staged
      Modified = $modified
      Untracked = $untracked
    }
  } catch {
    return [pscustomobject]@{
      Branch = "not-a-git-repo"
      Staged = 0
      Modified = 0
      Untracked = 0
    }
  }
}

function Get-AgentPurpose {
  param(
    [string]$RepositoryRoot
  )

  $agentsPath = Join-Path $RepositoryRoot "AGENTS.md"
  if (-not (Test-Path $agentsPath)) {
    return $null
  }

  $content = Get-Content $agentsPath -Raw
  $purposeMatch = [regex]::Match(
    $content,
    '## Purpose\s*(.+?)(\r?\n\r?\n|$)',
    [System.Text.RegularExpressions.RegexOptions]::Singleline
  )

  if ($purposeMatch.Success) {
    return $purposeMatch.Groups[1].Value.Trim()
  }

  return $null
}

$stdinText = [Console]::In.ReadToEnd()
$payload = $null
if ($stdinText.Trim()) {
  try {
    $payload = $stdinText | ConvertFrom-Json
  } catch {
    $payload = $null
  }
}

$sessionCwd = if ($payload -and $payload.cwd) {
  try {
    (Resolve-Path ([string]$payload.cwd) -ErrorAction Stop).Path
  } catch {
    [string]$payload.cwd
  }
} else {
  $null
}

if ($sessionCwd -ne $repoRoot) {
  exit 0
}

$gitExe = Get-GitExecutable
$gitInfo = Get-GitInfo -GitExe $gitExe -RepositoryRoot $repoRoot
$agentPurpose = Get-AgentPurpose -RepositoryRoot $repoRoot

$lines = New-Object System.Collections.Generic.List[string]
$source = if ($payload -and $payload.source) { [string]$payload.source } else { "startup" }

$lines.Add("Autobazar123 session context")
$lines.Add("- Start source: $source")

if ($agentPurpose) {
  $lines.Add("- App purpose: $agentPurpose")
}

$lines.Add("- Local policy: see AGENTS.md")
$lines.Add("- Git branch: $($gitInfo.Branch)")
$lines.Add("- Git status: $($gitInfo.Staged) staged, $($gitInfo.Modified) modified, $($gitInfo.Untracked) untracked")

if (-not (Test-Path (Join-Path $repoRoot "node_modules"))) {
  $lines.Add("- Warning: node_modules is missing")
}

if (-not (Test-Path (Join-Path $repoRoot ".env.local"))) {
  $lines.Add("- Warning: .env.local is missing")
}

[Console]::Out.WriteLine(($lines -join [Environment]::NewLine))
