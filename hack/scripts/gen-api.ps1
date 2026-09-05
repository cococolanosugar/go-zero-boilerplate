param (
    [string]$Service = "gateway"
)

$apiDesc = "app/$Service/desc/$Service.api"
$apiDir = "app/$Service"

if (-not (Test-Path $apiDesc)) {
    Write-Error "API desc file not found: $apiDesc"
    exit 1
}

Write-Host "Generating API code for $Service from $apiDesc..." -ForegroundColor Cyan
goctl api go -api $apiDesc -dir $apiDir -style go_zero
Write-Host "Done generating API for $Service!" -ForegroundColor Green
