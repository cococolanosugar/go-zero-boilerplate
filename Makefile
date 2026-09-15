.PHONY: gen-gateway gen-user-rpc gen-worker-rpc gen-ts gen-swagger gen-model new-rpc new-api run-gateway run-user-rpc run-worker-rpc run-admin run-admin-mock run-admin-test run-admin-pre run-portal run-portal-mock run-portal-test run-portal-pre build-frontend build-web tidy test test-frontend lint-antd ai-index rename-project docker-build docker-up docker-down docker-infra-up docker-infra-down migrate-new migrate-up migrate-down migrate-status gen-crud

TABLE ?= all
AMOUNT ?= 1

ifeq ($(OS),Windows_NT)
NEW_RPC = pwsh -File ./hack/scripts/new-rpc.ps1 -Service
NEW_API = pwsh -File ./hack/scripts/new-api.ps1 -Service
GEN_MODEL = pwsh -File ./hack/scripts/gen-model.ps1 -Table
RENAME_PROJECT = pwsh -File ./hack/scripts/rename-project.ps1 -NewModule
GEN_CRUD = pwsh -File ./hack/scripts/gen-crud.ps1 -Service
else
NEW_RPC = bash ./hack/scripts/new-rpc.sh
NEW_API = bash ./hack/scripts/new-api.sh
GEN_MODEL = bash ./hack/scripts/gen-model.sh
RENAME_PROJECT = bash ./hack/scripts/rename-project.sh
GEN_CRUD = bash ./hack/scripts/gen-crud.sh
endif

# 生成网关 API 代码
gen-gateway:
	goctl api go -api app/gateway/desc/gateway.api -dir app/gateway -style go_zero --type-group

# 生成 user-rpc 代码
gen-user-rpc:
	cd app/user/rpc && goctl rpc protoc user.proto --go_out=. --go-grpc_out=. --zrpc_out=. -m

# 生成 worker-rpc 代码
gen-worker-rpc:
	cd app/worker/rpc && goctl rpc protoc worker.proto --go_out=. --go-grpc_out=. --zrpc_out=. -m

# 创建新微服务 RPC 模块 (例如: make new-rpc SERVICE=order)
new-rpc:
	$(NEW_RPC) "$(SERVICE)"

# 创建新微服务 API 模块 (例如: make new-api SERVICE=order)
new-api:
	$(NEW_API) "$(SERVICE)"

# 生成 Model 持久层代码
gen-model:
	$(GEN_MODEL) "$(TABLE)"

# 基于网关契约生成前端 TypeScript SDK
gen-ts:
	goctl api swagger -api app/gateway/desc/gateway.api -dir manifest/swagger -filename gateway
	node frontend/packages/api/scripts/normalize-swagger.js
	cd frontend && pnpm --filter @zero/api codegen
	goctl api ts --api app/gateway/desc/gateway.api --dir frontend/packages/api/src

# 基于网关契约生成 OpenAPI / Swagger 契约
gen-swagger:
	goctl api swagger -api app/gateway/desc/gateway.api -dir manifest/swagger -filename gateway
	node -e "const fs = require('fs'); fs.copyFileSync('manifest/swagger/gateway.json', 'frontend/apps/admin/public/openapi.json');"

# 启动网关服务 (HTTP 8888)
run-gateway:
	cd app/gateway && go run gateway.go -f etc/gateway.yaml

# 启动 user-rpc 服务 (gRPC 8080)
run-user-rpc:
	cd app/user/rpc && go run user.go -f etc/user.yaml

# 启动 worker-rpc 异步任务微服务 (gRPC 8082，内置 Temporal Worker)
run-worker-rpc:
	cd app/worker/rpc && go run worker.go -f etc/worker.yaml

# 启动前端管理后台 (Vite 3001)
run-admin:
	cd frontend && pnpm dev:admin

# 启动前端管理后台 (离线 Mock 纯前端开发模式)
run-admin-mock:
	cd frontend && pnpm dev:admin:mock

# 启动前端管理后台 (连接远程测试环境网关)
run-admin-test:
	cd frontend && pnpm dev:admin:test

# 启动前端管理后台 (连接预发布环境网关)
run-admin-pre:
	cd frontend && pnpm dev:admin:pre

# 启动前端门户 (Vite 3000)
run-portal:
	cd frontend && pnpm dev:portal

# 启动前端门户 (离线 Mock 纯前端开发模式)
run-portal-mock:
	cd frontend && pnpm dev:portal:mock

# 启动前端门户 (连接远程测试环境网关)
run-portal-test:
	cd frontend && pnpm dev:portal:test

# 启动前端门户 (连接预发布环境网关)
run-portal-pre:
	cd frontend && pnpm dev:portal:pre

# 构建前端产物
build-frontend:
	cd frontend && pnpm build

build-web: build-frontend

# 运行前端全量自动化测试 (Vitest)
test-frontend:
	cd frontend && pnpm test

# 整理后端依赖
tidy:
	go mod tidy

# 脚手架一键重命名 (例如: make rename-project NEW_MODULE=my-app DISPLAY_NAME="My App")
rename-project:
	$(RENAME_PROJECT) "$(NEW_MODULE)" "$(DISPLAY_NAME)"

# 运行测试
test:
	go test ./...

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

# 创建新的数据库迁移版本文件 (例如: make migrate-new NAME=add_sys_notice)
migrate-new:
	atlas migrate new $(NAME) --env local
	atlas migrate hash --env local

# 执行数据库未应用的迁移升级
migrate-up:
	atlas migrate apply --env local

# 回滚最后一个迁移版本
migrate-down:
	atlas migrate down $(AMOUNT) --env local

# 查看数据库迁移同步状态
migrate-status:
	atlas migrate status --env local

# ================= 全栈 CRUD 代码生成器 =================

# 全栈一体化 CRUD 代码生成器 (例如: make gen-crud SERVICE=user TABLE=sys_post)
gen-crud:
	$(GEN_CRUD) "$(SERVICE)" "$(TABLE)"




