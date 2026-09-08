# 列出所有命令
default:
    @just --list

# 生成网关 API 代码
gen-gateway:
    goctl api go -api app/gateway/desc/gateway.api -dir app/gateway -style go_zero

# 生成指定服务 RPC 代码 (例如: just gen-rpc user / just gen-rpc order)
gen-rpc service="user":
    cd app/{{service}}/rpc && goctl rpc protoc {{service}}.proto --go_out=. --go-grpc_out=. --zrpc_out=. -m

# 生成指定微服务 Model 持久层代码 (例如: just gen-model all / just gen-model user)
gen-model table="all":
    pwsh -File ./hack/scripts/gen-model.ps1 -Table {{table}}

# 基于网关契约生成前端 TypeScript SDK
gen-ts:
    goctl api ts --api app/gateway/desc/gateway.api --dir frontend/packages/api/src

# 启动网关服务 (HTTP 8888)
run-gateway:
    cd app/gateway && go run gateway.go -f etc/gateway.yaml

# 启动 user-rpc 服务 (gRPC 8080)
run-user-rpc:
    cd app/user/rpc && go run user.go -f etc/user.yaml

# 启动 order-rpc 服务 (gRPC 8081)
run-order-rpc:
    cd app/order/rpc && go run order.go -f etc/order.yaml

# 启动前端管理后台 (Vite 3001，默认本地 8888 网关)
run-admin:
    cd frontend && pnpm dev:admin

# 启动前端管理后台 (连接远程测试环境网关)
run-admin-test:
    cd frontend && pnpm dev:admin:test

# 启动前端管理后台 (连接预发布环境网关)
run-admin-pre:
    cd frontend && pnpm dev:admin:pre

# 启动前端门户 (Vite 3000，默认本地 8888 网关)
run-portal:
    cd frontend && pnpm dev:portal

# 启动前端门户 (连接远程测试环境网关)
run-portal-test:
    cd frontend && pnpm dev:portal:test

# 构建全端前端产物
build-frontend:
    cd frontend && pnpm build

# 兼容别名
build-web:
    @just build-frontend

# 整理后端 Go 依赖
tidy:
    go mod tidy

# 脚手架一键重命名 (例如: just rename-project my-app "My Awesome App")
rename-project new_module="my-app" display_name="":
    pwsh -File ./hack/scripts/rename-project.ps1 -NewModule {{new_module}} -DisplayName "{{display_name}}"

# 对前端应用进行 Ant Design 语法与弃用 API 静态诊断
lint-antd:
    antd lint ./frontend/apps/admin/src
    antd lint ./frontend/apps/portal/src

# 构建 AI 代码知识图谱与全景索引 (CodeGraph + GitNexus)
ai-index:
    codegraph init
    gitnexus analyze

# 构建全栈所有 Docker 镜像
docker-build:
    docker build -t go-zero-user-rpc:latest -f app/user/rpc/Dockerfile .
    docker build -t go-zero-order-rpc:latest -f app/order/rpc/Dockerfile .
    docker build -t go-zero-gateway:latest -f app/gateway/Dockerfile .
    docker build -t go-zero-frontend:latest -f frontend/Dockerfile .

# 一键启动全栈所有容器 (基础设施 + 微服务 + 网关 + 前端)
docker-up:
    docker-compose -f manifest/deploy/docker-compose/docker-compose.all.yml up -d --build

# 停止全栈所有容器
docker-down:
    docker-compose -f manifest/deploy/docker-compose/docker-compose.all.yml down

# 仅启动本地开发所需的中间件容器 (MySQL, Redis, Etcd, Nacos)
docker-infra-up:
    docker-compose -f manifest/deploy/docker-compose/docker-compose.yml up -d

# 停止本地开发中间件容器
docker-infra-down:
    docker-compose -f manifest/deploy/docker-compose/docker-compose.yml down

