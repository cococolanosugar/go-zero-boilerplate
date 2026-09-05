$apiDesc = "app/gateway/desc/gateway.api"
$targetDir = "frontend/packages/api/src"

if (-not (Test-Path $apiDesc)) {
    Write-Error "Gateway API desc file not found: $apiDesc"
    exit 1
}

Write-Host "Generating TypeScript SDK from $apiDesc to $targetDir..." -ForegroundColor Cyan
goctl api ts --api $apiDesc --dir $targetDir

# Ensure index.ts exports
$indexFile = "$targetDir/index.ts"
if (-not (Test-Path $indexFile)) {
    Set-Content -Path $indexFile -Value "export * from './gateway';`nexport * from './gatewayComponents';`nexport * from './gocliRequest';"
}

Write-Host "Done generating TypeScript SDK!" -ForegroundColor Green
