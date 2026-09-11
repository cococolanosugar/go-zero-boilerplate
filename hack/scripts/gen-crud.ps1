[CmdletBinding()]
param (
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Service,

    [Parameter(Mandatory = $true, Position = 1)]
    [string]$Table,

    [Parameter(Mandatory = $false)]
    [string]$Dsn = "root:root@tcp(127.0.0.1:3306)/go_zero_boilerplate"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = (Resolve-Path "$scriptDir\..\..").Path

# 优先使用 mise 安装的 Go
$goExe = "go"
$miseGo = "$env:LOCALAPPDATA\mise\installs\go\1.26.5\bin\go.exe"
if (Test-Path $miseGo) {
    $goExe = $miseGo
}

Write-Host "==> [gen-crud] 正在运行全栈代码生成器 (服务: $Service, 表: $Table)..." -ForegroundColor Cyan

Set-Location $rootDir
& $goExe run ./hack/generator -service $Service -table $Table -dsn $Dsn -out $rootDir

if ($LASTEXITCODE -ne 0) {
    Write-Error "代码生成器执行失败 (ExitCode: $LASTEXITCODE)"
}
