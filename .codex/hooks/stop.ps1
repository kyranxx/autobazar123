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

function Get-GitSummary {
  param(
    [string]$GitExe,
    [string]$RepositoryRoot
  )

  try {
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

    return "$staged staged, $modified modified, $untracked untracked"
  } catch {
    return "git status unavailable"
  }
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
$gitSummary = Get-GitSummary -GitExe $gitExe -RepositoryRoot $repoRoot
$reminder = "Session stop reminder: git has $gitSummary. Update tasks/todo.md Review if this session changed work. If the user corrected the agent, update tasks/lessons.md. Baseline before handoff: npm run lint; npx tsc --noEmit; npm run test:unit."

$output = [ordered]@{
  continue = $true
  systemMessage = $reminder
}

$output | ConvertTo-Json -Compress
