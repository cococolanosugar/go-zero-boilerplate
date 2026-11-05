param (
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Service
)

$ErrorActionPreference = "Stop"

$root = (Resolve-Path "$PSScriptRoot/../..").Path
$targetDir = "$root/app/$Service"
$templateDir = "$root/hack/template"

if ((Test-Path "$targetDir/$Service.go") -or (Test-Path "$targetDir/$Service.proto")) {
    Write-Error "Service already exists at $targetDir"
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

Write-Host "Creating new microservice '$Service' in app/$Service..." -ForegroundColor Cyan

Push-Location $targetDir
try {
    # 进入 app/$Service 执行 goctl rpc new
    goctl rpc new $Service --home ../../hack/template

    $generatedDir = "$targetDir/$Service"
    if (-not (Test-Path $generatedDir)) {
        Write-Error "Failed to generate RPC service: $generatedDir not found."
        exit 1
    }

    # 将生成的文件扁平化移至 app/$Service
    Get-ChildItem -Path $generatedDir | ForEach-Object {
        Move-Item -Path $_.FullName -Destination $targetDir -Force
    }
    Remove-Item -Path $generatedDir -Force -Recurse

    # 自动修正 goctl 相对生成导入路径: app/$Service/$Service -> app/$Service
    $goFiles = Get-ChildItem -Path $targetDir -Filter "*.go" -Recurse
    foreach ($file in $goFiles) {
        $content = Get-Content $file.FullName -Raw
        if ($content -match "app/$Service/$Service") {
            $content = $content.Replace("app/$Service/$Service", "app/$Service")
            Set-Content -Path $file.FullName -Value $content -NoNewline
        }
    }

    Write-Host "Done! Microservice '$Service' created successfully at app/$Service" -ForegroundColor Green
} finally {
    Pop-Location
}
