# 多阶段构建：Titan 微服务 (gRPC)
FROM golang:1.25-alpine AS builder

WORKDIR /build

RUN apk add --no-cache tzdata ca-certificates

# 预先下载依赖以充分利用 Docker 缓存层
COPY go.mod go.sum ./
RUN go env -w GOPROXY="https://goproxy.cn,direct" && go mod download

# 复制全局库与 Titan 服务代码
COPY pkg/ pkg/
COPY app/titan/ app/titan/

# 静态交叉编译 Linux 二进制产物
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/titan-rpc app/titan/rpc/titan.go

# 生产运行镜像：轻量 Alpine 运行时
FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Shanghai

COPY --from=builder /app/titan-rpc /app/titan-rpc
COPY --from=builder /build/app/titan/rpc/etc /app/etc

EXPOSE 8086

ENTRYPOINT ["./titan-rpc", "-f", "etc/titan.yaml"]
