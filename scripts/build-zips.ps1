# Build Claude.ai-ready zips for every Live skill.
#
# Output:
#   dist/org/<skill>.zip       — Organization panel skills (Alex uses them too)
#   dist/personal/<skill>.zip  — Personal panel skills (Ben-only, dev workflow)
#
# Uses the .NET ZipFile API with explicit forward-slash entry names so the
# resulting zips pass Claude.ai's upload validator. Windows default
# Compress-Archive produces backslash separators and silently breaks uploads.
#
# Regenerate whenever you add a skill, edit frontmatter, or flip Lifecycle.

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

$orgSkills = @(
  'client-prep', 'onboard-client', 'fleet-health', 'pattern-cloud',
  'prospect-audit', 'content-brief', 'content-production', 'content-strategy',
  'content-audit', 'content-tracker', 'editorial-qa', 'social-repurpose',
  'publish', 'content-hero-image', 'content-image-library', 'seo-report',
  'seo-research', 'link-builder', 'pseo', 'pseo-manage', 'report'
)

$personalSkills = @(
  'voyager-abilities', 'voyager-ai-integration', 'voyager-orbit-dev',
  'wp-lab', 'ship-session'
)

function Build-SkillZip($skillName, $destDir) {
  $src = Join-Path $root "skills\$skillName"
  $dst = Join-Path $destDir "$skillName.zip"

  if (-not (Test-Path $src)) {
    Write-Warning "Skipping $skillName — source not found at $src"
    return $null
  }
  if (Test-Path $dst) { Remove-Item $dst }

  $zip = [System.IO.Compression.ZipFile]::Open($dst, [System.IO.Compression.ZipArchiveMode]::Create)
  try {
    $files = Get-ChildItem -Path $src -Recurse -File
    foreach ($f in $files) {
      $relative = $f.FullName.Substring($src.Length + 1) -replace '\\', '/'
      $entryName = "$skillName/$relative"
      [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
        $zip, $f.FullName, $entryName, [System.IO.Compression.CompressionLevel]::Optimal
      ) | Out-Null
    }
  } finally {
    $zip.Dispose()
  }
  return (Get-Item $dst).Length
}

$orgDir = Join-Path $root 'dist\org'
$personalDir = Join-Path $root 'dist\personal'
New-Item -Path $orgDir -ItemType Directory -Force | Out-Null
New-Item -Path $personalDir -ItemType Directory -Force | Out-Null

Write-Output "Building Org zips ($($orgSkills.Count)):"
foreach ($s in $orgSkills) {
  $size = Build-SkillZip $s $orgDir
  if ($null -ne $size) {
    Write-Output ("  {0}.zip ({1} bytes)" -f $s, $size)
  }
}

Write-Output ""
Write-Output "Building Personal zips ($($personalSkills.Count)):"
foreach ($s in $personalSkills) {
  $size = Build-SkillZip $s $personalDir
  if ($null -ne $size) {
    Write-Output ("  {0}.zip ({1} bytes)" -f $s, $size)
  }
}

Write-Output ""
Write-Output "Done. Open dist/org and dist/personal to upload via Customize > Skills."
