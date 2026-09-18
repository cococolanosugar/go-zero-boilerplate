# 列出所有命令
default:
    @just --list

# 生成网关 API 代码
gen-gateway:
    goctl api go -api app/gateway/desc/gateway.api -dir app/gateway -style go_zero --type-group

# 生成指定服务 RPC 代码 (例如: just gen-rpc user / just gen-rpc order)
gen-rpc service="user":
    cd app/{{service}}/rpc && goctl rpc protoc {{service}}.proto --go_out=. --go-grpc_out=. --zrpc_out=. -m

# 生成指定微服务 Model 持久层代码 (例如: just gen-model all / just gen-model user)
[windows]
gen-model table="all":
    pwsh -File ./hack/scripts/gen-model.ps1 -Table {{table}}

[unix]
gen-model table="all":
    bash ./hack/scripts/gen-model.sh {{table}}

# 创建新微服务 RPC 模块 (例如: just new-rpc order)
[windows]
new-rpc service:
    pwsh -File ./hack/scripts/new-rpc.ps1 -Service {{service}}

[unix]
new-rpc service:
    bash ./hack/scripts/new-rpc.sh {{service}}

# 创建新微服务 API 模块 (例如: just new-api order)
[windows]
new-api service:
    pwsh -File ./hack/scripts/new-api.ps1 -Service {{service}}

[unix]
new-api service:
    bash ./hack/scripts/new-api.sh {{service}}

# 基于网关契约生成前端 TypeScript SDK (OpenAPI + Orval 模块化切分及完整兼容定义)
gen-ts:
    goctl api swagger -api app/gateway/desc/gateway.api -dir manifest/openapi -filename swagger
    go run ./hack/tool/conv-openapi
    cd frontend && pnpm --filter @zero/api codegen
    goctl api ts --api app/gateway/desc/gateway.api --dir frontend/packages/api/src

# 基于网关契约生成 OpenAPI 契约
gen-openapi:
    goctl api swagger -api app/gateway/desc/gateway.api -dir manifest/openapi -filename swagger
    go run ./hack/tool/conv-openapi

# 兼容旧命令名
gen-swagger: gen-openapi

# 启动网关服务 (HTTP 8888)
run-gateway:
    cd app/gateway && go run gateway.go -f etc/gateway.yaml

# 启动 user-rpc 服务 (gRPC 8080)
run-user-rpc:
    cd app/user/rpc && go run user.go -f etc/user.yaml

# 启动 worker-rpc 异步任务微服务 (gRPC 8082，内置 Temporal Worker)
run-worker-rpc:
    cd app/worker/rpc && go run worker.go -f etc/worker.yaml

# 启动 itsm-rpc 工单引擎微服务 (gRPC 8084，BPMN 2.0 + SLA)
run-itsm-rpc:
    cd app/itsm/rpc && go run itsm.go -f etc/itsm.yaml

# 启动 titan-rpc 研发交付微服务 (gRPC 8086，Titan CI/CD 引擎)
run-titan-rpc:
    cd app/titan/rpc && go run titan.go -f etc/titan.yaml

# 生成 titan-rpc 代码
gen-titan-rpc:
    cd app/titan/rpc && goctl rpc protoc titan.proto --go_out=. --go-grpc_out=. --zrpc_out=. -m

# 启动前端管理后台 (Vite 3001，默认本地 8888 网关)
run-admin:
    cd frontend && pnpm dev:admin

# 启动前端管理后台 (离线 Mock 纯前端开发模式，零依赖后端与中间件)
run-admin-mock:
    cd frontend && pnpm dev:admin:mock

# 启动前端管理后台 (连接远程测试环境网关)
run-admin-test:
    cd frontend && pnpm dev:admin:test

# 启动前端管理后台 (连接预发布环境网关)
run-admin-pre:
    cd frontend && pnpm dev:admin:pre

# 启动前端门户 (Vite 3000，默认本地 8888 网关)
run-portal:
    cd frontend && pnpm dev:portal

# 启动前端门户 (离线 Mock 纯前端开发模式)
run-portal-mock:
    cd frontend && pnpm dev:portal:mock

# 启动前端门户 (连接远程测试环境网关)
run-portal-test:
    cd frontend && pnpm dev:portal:test

# 构建全端前端产物
build-frontend:
    cd frontend && pnpm build

# 运行前端全量自动化测试 (Vitest)
test-frontend:
    cd frontend && pnpm test

# 运行后端全量自动化测试
test:
    go test ./...

# 兼容别名
build-web:
    @just build-frontend

# 整理后端 Go 依赖
tidy:
    go mod tidy

# 脚手架一键重命名 (例如: just rename-project my-app "My Awesome App")
[windows]
rename-project new_module="my-app" display_name="":
    pwsh -File ./hack/scripts/rename-project.ps1 -NewModule {{new_module}} -DisplayName "{{display_name}}"

[unix]
rename-project new_module="my-app" display_name="":
    bash ./hack/scripts/rename-project.sh "{{new_module}}" "{{display_name}}"

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
    docker build -t go-zero-worker-rpc:latest -f app/worker/rpc/Dockerfile .
    docker build -t go-zero-itsm-rpc:latest -f app/itsm/rpc/Dockerfile .
    docker build -t go-zero-titan-rpc:latest -f app/titan/rpc/Dockerfile .
    docker build -t go-zero-gateway:latest -f app/gateway/Dockerfile .
    docker build -t go-zero-frontend:latest -f frontend/Dockerfile .

# 一键启动全栈所有容器 (基础设施 + 微服务 + 网关 + 前端)
docker-up:
    docker compose -f manifest/deploy/docker-compose/docker-compose.all.yml up -d --build

# 停止全栈所有容器
docker-down:
    docker compose -f manifest/deploy/docker-compose/docker-compose.all.yml down

# 仅启动本地开发所需的中间件容器 (MySQL, Redis, Etcd, Nacos)
docker-infra-up:
    docker compose -f manifest/deploy/docker-compose/docker-compose.yml up -d

# 停止本地开发中间件容器
docker-infra-down:
    docker compose -f manifest/deploy/docker-compose/docker-compose.yml down

# ================= 数据库版本迁移流水线 (Atlas Migrations) =================

# 创建新的数据库迁移版本文件 (例如: just migrate-new add_sys_notice)
migrate-new name:
    atlas migrate new {{name}} --env local
    atlas migrate hash --env local

# 执行数据库未应用的迁移升级
migrate-up:
    atlas migrate apply --env local

# 回滚最后一个迁移版本
migrate-down amount="1":
    atlas migrate down {{amount}} --env local

# 查看数据库迁移同步状态
migrate-status:
    atlas migrate status --env local

# ================= 全栈 CRUD 代码生成器 =================

# 全栈一体化 CRUD 代码生成器 (例如: just gen-crud user sys_post)
[windows]
gen-crud service table:
    pwsh -File ./hack/scripts/gen-crud.ps1 -Service {{service}} -Table {{table}}

[unix]
gen-crud service table:
    bash ./hack/scripts/gen-crud.sh "{{service}}" "{{table}}"


