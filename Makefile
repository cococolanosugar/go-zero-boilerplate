.PHONY: gen-gateway gen-user-rpc gen-order-rpc gen-ts run-gateway run-user-rpc run-order-rpc run-admin run-portal build-frontend build-web tidy test lint-antd ai-index rename-project

# 生成网关 API 代码
gen-gateway:
	goctl api go -api app/gateway/desc/gateway.api -dir app/gateway -style go_zero

# 生成 user-rpc 代码
gen-user-rpc:
	cd app/user/rpc && goctl rpc protoc user.proto --go_out=. --go-grpc_out=. --zrpc_out=. -m

# 生成 order-rpc 代码
gen-order-rpc:
	cd app/order/rpc && goctl rpc protoc order.proto --go_out=. --go-grpc_out=. --zrpc_out=. -m

# 生成 Model 持久层代码
gen-model:
	bash ./hack/scripts/gen-model.sh all

# 生成前端 TS SDK
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

# 启动前端管理后台 (Vite 3001)
run-admin:
	cd frontend && pnpm dev:admin

# 启动前端门户 (Vite 3000)
run-portal:
	cd frontend && pnpm dev:portal

# 构建前端产物
build-frontend:
	cd frontend && pnpm build

build-web: build-frontend

# 整理后端依赖
tidy:
	go mod tidy

# 脚手架一键重命名 (例如: make rename-project NEW_MODULE=my-app DISPLAY_NAME="My App")
rename-project:
	bash ./hack/scripts/rename-project.sh $(NEW_MODULE) "$(DISPLAY_NAME)"

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



