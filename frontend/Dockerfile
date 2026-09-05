# 多阶段构建：前端应用静态编译与 Nginx 托管
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.17.0 --activate

# 拷贝前端工作区根配置
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml frontend/tsconfig.base.json ./
COPY frontend/packages/ ./packages/
COPY frontend/apps/ ./apps/

# 安装依赖并编译全端前端产物
RUN pnpm install --frozen-lockfile
RUN pnpm build

# 生产运行镜像：轻量 Nginx 容器
FROM nginx:1.27-alpine

COPY manifest/deploy/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html/admin
COPY --from=builder /app/apps/portal/dist /usr/share/nginx/html/portal

EXPOSE 3000 3001

CMD ["nginx", "-g", "daemon off;"]
