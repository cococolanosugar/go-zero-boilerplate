param (
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$NewModule,
    [Parameter(Position = 1)]
    [string]$DisplayName = ""
)

$ErrorActionPreference = "Stop"

# 定位工程根目录
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Resolve-Path "$ScriptDir/../..").Path

Set-Location $ProjectRoot

if (-not (Test-Path "go.mod")) {
    Write-Error "Error: go.mod not found at $ProjectRoot. Please run from project root."
    exit 1
}

$OldModule = "go-zero-boilerplate"
$OldDbName = "go_zero_boilerplate"
$OldDisplayName = "Go-Zero Boilerplate"

# 计算简短名称与数据库名称
$NewShortName = ($NewModule -split '/')[-1]
$NewDbName = $NewShortName.Replace('-', '_')

if ([string]::IsNullOrWhiteSpace($DisplayName)) {
    $parts = $NewShortName -split '[-_]'
    $DisplayName = ($parts | ForEach-Object { (Get-Culture).TextInfo.ToTitleCase($_) }) -join ' '
}

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "       Go-Zero Boilerplate Project Rebranding    " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Old Module:      $OldModule"
Write-Host "New Module:      $NewModule"
Write-Host "New Short Name:  $NewShortName"
Write-Host "New Database:    $NewDbName"
Write-Host "New Display:     $DisplayName"
Write-Host "-------------------------------------------------"

# 1. 替换 go.mod 与所有 Go 代码中的 module 及 import
Write-Host "Updating Go module and imports..." -ForegroundColor Yellow
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$goFiles = Get-ChildItem -Path . -Recurse -Include *.go, go.mod -Exclude vendor
$goCount = 0
foreach ($file in $goFiles) {
    $content = [System.IO.File]::ReadAllText($file.FullName, $Utf8NoBom)
    if ($content.Contains($OldModule)) {
        $newContent = $content.Replace($OldModule, $NewModule)
        [System.IO.File]::WriteAllText($file.FullName, $newContent, $Utf8NoBom)
        $goCount++
    }
}
Write-Host "Updated $goCount Go files." -ForegroundColor Green

# 2. 替换 YAML 配置与 Docker Compose
Write-Host "Updating YAML configuration and Docker Compose files..." -ForegroundColor Yellow
$yamlFiles = Get-ChildItem -Path . -Recurse -Include *.yaml, *.yml -Exclude node_modules, .git
$yamlCount = 0
foreach ($file in $yamlFiles) {
    $content = [System.IO.File]::ReadAllText($file.FullName, $Utf8NoBom)
    $modified = $false
    if ($content.Contains($OldModule)) {
        $content = $content.Replace($OldModule, $NewShortName)
        $modified = $true
    }
    if ($content.Contains($OldDbName)) {
        $content = $content.Replace($OldDbName, $NewDbName)
        $modified = $true
    }
    if ($modified) {
        [System.IO.File]::WriteAllText($file.FullName, $content, $Utf8NoBom)
        $yamlCount++
    }
}
Write-Host "Updated $yamlCount YAML files." -ForegroundColor Green

# 3. 替换 SQL 脚本中的数据库名
Write-Host "Updating SQL schema files..." -ForegroundColor Yellow
$sqlFiles = Get-ChildItem -Path manifest/sql -Recurse -Include *.sql -ErrorAction SilentlyContinue
$sqlCount = 0
if ($sqlFiles) {
    foreach ($file in $sqlFiles) {
        $content = [System.IO.File]::ReadAllText($file.FullName, $Utf8NoBom)
        if ($content.Contains($OldDbName)) {
            $newContent = $content.Replace($OldDbName, $NewDbName)
            [System.IO.File]::WriteAllText($file.FullName, $newContent, $Utf8NoBom)
            $sqlCount++
        }
    }
}
Write-Host "Updated $sqlCount SQL files." -ForegroundColor Green

# 4. 替换前端工程与标题配置
Write-Host "Updating Frontend packages and UI constants..." -ForegroundColor Yellow
$frontendFiles = @(
    "frontend/package.json",
    "frontend/packages/shared/src/index.ts",
    "frontend/apps/portal/src/pages/Services/index.tsx"
)
foreach ($relPath in $frontendFiles) {
    if (Test-Path $relPath) {
        $content = [System.IO.File]::ReadAllText($relPath, $Utf8NoBom)
        $content = $content.Replace($OldModule, $NewShortName)
        $content = $content.Replace($OldDisplayName, $DisplayName)
        [System.IO.File]::WriteAllText($relPath, $content, $Utf8NoBom)
        Write-Host "  Updated $relPath" -ForegroundColor Green
    }
}

# 5. 替换构建配置 (justfile, Makefile)
Write-Host "Updating Build configs (justfile, Makefile)..." -ForegroundColor Yellow
$buildFiles = @(
    "justfile",
    "Makefile"
)
foreach ($relPath in $buildFiles) {
    if (Test-Path $relPath) {
        $content = [System.IO.File]::ReadAllText($relPath, $Utf8NoBom)
        $content = $content.Replace($OldDbName, $NewDbName)
        $content = $content.Replace($OldModule, $NewShortName)
        [System.IO.File]::WriteAllText($relPath, $content, $Utf8NoBom)
        Write-Host "  Updated $relPath" -ForegroundColor Green
    }
}

Write-Host "-------------------------------------------------"
Write-Host "Project successfully rebranded to '$NewModule'!" -ForegroundColor Green
Write-Host "Next recommended steps:"
Write-Host "  1. Run 'go mod tidy' to refresh dependencies"
Write-Host "  2. Run 'just gen-gateway' to update API routes"
Write-Host "  3. Run 'just test' to verify test cases"
Write-Host "================================================="
