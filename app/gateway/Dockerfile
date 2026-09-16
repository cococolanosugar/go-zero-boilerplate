# 多阶段构建：Gateway 统一接入网关
FROM golang:1.25-alpine AS builder

WORKDIR /build

RUN apk add --no-cache tzdata ca-certificates

# 预先下载依赖以充分利用 Docker 缓存层
COPY go.mod go.sum ./
RUN go env -w GOPROXY="https://goproxy.cn,direct" && go mod download

# 复制全局库与网关相关代码
COPY pkg/ pkg/
COPY app/user/rpc/client/ app/user/rpc/client/
COPY app/user/rpc/pb/ app/user/rpc/pb/
COPY app/worker/rpc/client/ app/worker/rpc/client/
COPY app/worker/rpc/pb/ app/worker/rpc/pb/
COPY app/worker/contract/ app/worker/contract/
COPY app/itsm/rpc/client/ app/itsm/rpc/client/
COPY app/itsm/rpc/itsm/ app/itsm/rpc/itsm/
COPY app/gateway/ app/gateway/

# 静态交叉编译 Linux 二进制产物
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/gateway app/gateway/gateway.go

# 生产运行镜像：轻量 Alpine 运行时
FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Shanghai

COPY --from=builder /app/gateway /app/gateway
COPY --from=builder /build/app/gateway/etc /app/etc
COPY manifest/openapi/ /app/manifest/openapi/

EXPOSE 8888

ENTRYPOINT ["./gateway", "-f", "etc/gateway.yaml"]
