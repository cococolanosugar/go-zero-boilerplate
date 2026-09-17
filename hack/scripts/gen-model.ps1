param (
    [string]$Table = "all"
)

if ($Table -eq "all" -or $Table -eq "user") {
    Write-Host "Generating user model from manifest/sql/user.sql..." -ForegroundColor Cyan
    goctl model mysql ddl -src manifest/sql/user.sql -dir app/user/model -c --style go_zero
}

if ($Table -eq "all" -or $Table -eq "rbac" -or $Table -eq "system") {
    Write-Host "Generating RBAC and system models from manifest/sql/rbac_schema.sql..." -ForegroundColor Cyan
    goctl model mysql ddl -src manifest/sql/rbac_schema.sql -dir app/user/model -c --style go_zero
}

if ($Table -eq "all" -or $Table -eq "dict") {
    Write-Host "Generating Dict models from manifest/sql/dict_schema.sql..." -ForegroundColor Cyan
    goctl model mysql ddl -src manifest/sql/dict_schema.sql -dir app/user/model -c --style go_zero
}

if ($Table -eq "all" -or $Table -eq "log") {
    Write-Host "Generating Audit Log models from manifest/sql/log_schema.sql..." -ForegroundColor Cyan
    goctl model mysql ddl -src manifest/sql/log_schema.sql -dir app/user/model -c --style go_zero
}

if ($Table -eq "all" -or $Table -eq "itsm") {
    Write-Host "Generating ITSM models from manifest/sql/itsm_schema.sql..." -ForegroundColor Cyan
    goctl model mysql ddl -src manifest/sql/itsm_schema.sql -dir app/itsm/model -c --style go_zero
}

if ($Table -eq "all" -or $Table -eq "devops" -or $Table -eq "titan") {
    Write-Host "Generating Titan DevOps models from manifest/sql/devops_schema.sql..." -ForegroundColor Cyan
    goctl model mysql ddl -src manifest/sql/devops_schema.sql -dir app/devops/model -c --style go_zero
}

Write-Host "Done generating database models!" -ForegroundColor Green
