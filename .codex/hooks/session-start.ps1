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

function Get-OpenTodoItems {
  param(
    [string]$RepositoryRoot
  )

  $todoPath = Join-Path $RepositoryRoot "tasks\\todo.md"
  if (-not (Test-Path $todoPath)) {
    return @()
  }

  return @(Get-Content $todoPath | Where-Object { $_ -match '^- \[ \] ' } | Select-Object -First 5)
}

function Get-AgentGuideSummary {
  param(
    [string]$RepositoryRoot
  )

  $agentsPath = Join-Path $RepositoryRoot "AGENTS.md"
  if (-not (Test-Path $agentsPath)) {
    return $null
  }

  $content = Get-Content $agentsPath -Raw

  $purposeMatch = [regex]::Match($content, '## Purpose \(WHY\)\s*(.+)')
  $workflowMatch = [regex]::Match($content, '## Workflow \(HOW\)\s*1\.\s*(.+?)\s*2\.\s*(.+?)\s*3\.\s*(.+?)\s*4\.\s*(.+?)(\r?\n\r?\n|$)', [System.Text.RegularExpressions.RegexOptions]::Singleline)

  $summary = [ordered]@{
    Purpose = $null
    Workflow = @()
  }

  if ($purposeMatch.Success) {
    $summary.Purpose = $purposeMatch.Groups[1].Value.Trim()
  }

  if ($workflowMatch.Success) {
    $summary.Workflow = @(
      $workflowMatch.Groups[1].Value.Trim(),
      $workflowMatch.Groups[2].Value.Trim(),
      $workflowMatch.Groups[3].Value.Trim(),
      $workflowMatch.Groups[4].Value.Trim()
    )
  }

  return $summary
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
$agentGuideSummary = Get-AgentGuideSummary -RepositoryRoot $repoRoot
$requiredFiles = @("package.json", "README.md", "AGENTS.md", "tasks\\todo.md")
$missingFiles = @($requiredFiles | Where-Object { -not (Test-Path (Join-Path $repoRoot $_)) })
$openTodos = Get-OpenTodoItems -RepositoryRoot $repoRoot

$lines = New-Object System.Collections.Generic.List[string]
$source = if ($payload -and $payload.source) { [string]$payload.source } else { "startup" }

$lines.Add("Autobazar123 session context")
$lines.Add("- Start source: $source")

if ($agentGuideSummary -and $agentGuideSummary.Purpose) {
  $lines.Add("- App purpose: $($agentGuideSummary.Purpose)")
}

if ($agentGuideSummary -and $agentGuideSummary.Workflow.Count -gt 0) {
  $lines.Add("- Required workflow:")
  foreach ($workflowItem in $agentGuideSummary.Workflow) {
    $lines.Add("  - $workflowItem")
  }
}

$lines.Add("- Git branch: $($gitInfo.Branch)")
$lines.Add("- Git status: $($gitInfo.Staged) staged, $($gitInfo.Modified) modified, $($gitInfo.Untracked) untracked")

if ($missingFiles.Count -eq 0) {
  $lines.Add("- Required repo files: present")
} else {
  $lines.Add("- Missing required files: $($missingFiles -join ', ')")
}

if (-not (Test-Path (Join-Path $repoRoot "node_modules"))) {
  $lines.Add("- Warning: node_modules is missing")
}

if (-not (Test-Path (Join-Path $repoRoot ".env.local"))) {
  $lines.Add("- Warning: .env.local is missing")
}

if ($openTodos.Count -gt 0) {
  $lines.Add("- Open todo items:")
  foreach ($item in $openTodos) {
    $lines.Add("  $item")
  }
}

$lines.Add("- Baseline verification before finish: npx tsc --noEmit")

[Console]::Out.WriteLine(($lines -join [Environment]::NewLine))
