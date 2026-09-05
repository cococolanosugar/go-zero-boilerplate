param (
    [string]$Table = "all"
)

if ($Table -eq "all" -or $Table -eq "user") {
    Write-Host "Generating user model from manifest/sql/user.sql..." -ForegroundColor Cyan
    goctl model mysql ddl -src manifest/sql/user.sql -dir app/user/model -c --style go_zero
}

if ($Table -eq "all" -or $Table -eq "order") {
    Write-Host "Generating orders model from manifest/sql/order.sql..." -ForegroundColor Cyan
    goctl model mysql ddl -src manifest/sql/order.sql -dir app/order/model -c --style go_zero
}

Write-Host "Done generating database models!" -ForegroundColor Green
