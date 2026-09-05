param (
    [string]$Service = "user"
)

$protoFile = "$Service.proto"
$rpcDir = "app/$Service/rpc"

if (-not (Test-Path "$rpcDir/$protoFile")) {
    Write-Error "Proto file not found: $rpcDir/$protoFile"
    exit 1
}

Write-Host "Generating RPC code for $Service from $rpcDir/$protoFile..." -ForegroundColor Cyan
Push-Location $rpcDir
try {
    goctl rpc protoc $protoFile --go_out=. --go-grpc_out=. --zrpc_out=. -m
    Write-Host "Done generating RPC for $Service!" -ForegroundColor Green
} finally {
    Pop-Location
}
