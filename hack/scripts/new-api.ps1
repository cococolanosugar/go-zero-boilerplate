param (
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Service
)

$ErrorActionPreference = "Stop"

$root = (Resolve-Path "$PSScriptRoot/../..").Path
$targetDir = "$root/app/$Service"
$apiDir = "$targetDir/api"
$templateDir = "$root/hack/template"

if (Test-Path $apiDir) {
    Write-Error "API service already exists at $apiDir"
    exit 1
}

# 确保模板目录存在
if (-not (Test-Path $templateDir)) {
    Write-Host "Initializing templates in $templateDir..." -ForegroundColor Cyan
    goctl template init --home $templateDir
}

# 确保 app/$Service 目录存在
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

Write-Host "Creating new API service '$Service' in app/$Service..." -ForegroundColor Cyan

Push-Location $targetDir
try {
    # 进入 app/$Service 执行 goctl api new
    goctl api new $Service --home ../../hack/template

    $generatedDir = "$targetDir/$Service"
    if (-not (Test-Path $generatedDir)) {
        Write-Error "Failed to generate API service: $generatedDir not found."
        exit 1
    }

    # 将生成目录重命名为 api
    Rename-Item -Path $generatedDir -NewName "api"

    # 自动修正 goctl 相对生成导入路径: app/$Service/$Service -> app/$Service/api
    $goFiles = Get-ChildItem -Path $apiDir -Filter "*.go" -Recurse
    foreach ($file in $goFiles) {
        $content = Get-Content $file.FullName -Raw
        if ($content -match "app/$Service/$Service") {
            $content = $content.Replace("app/$Service/$Service", "app/$Service/api")
            Set-Content -Path $file.FullName -Value $content -NoNewline
        }
    }

    Write-Host "Done! API service '$Service' created successfully at app/$Service/api" -ForegroundColor Green
} finally {
    Pop-Location
}
