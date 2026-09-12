## 1. 通用存储驱动抽象与实现 (pkg/storage)

- [x] 1.1 在 `pkg/storage` 中定义统一驱动接口 `Driver`、`FileInfo` 与存储配置 `Config`
- [x] 1.2 实现 `LocalStorageDriver`，内置年月日分级目录、SHA-256 哈希计算、危险文件后缀拦截与最大尺寸校验
- [x] 1.3 编写 `pkg/storage` 单元测试并验证各种边界场景（正常上传、非法后缀拦截、路径安全）

## 2. 网关配置与服务上下文集成

- [x] 2.1 在 `app/gateway/internal/config/config.go` 与 `etc/gateway.yaml` 中增加 `Storage` 配置项
- [x] 2.2 在 `app/gateway/internal/svc/service_context.go` 中初始化 `storage.Driver` 实例

## 3. 网关文件上传契约与静态代理

- [x] 3.1 在 `app/gateway/desc/system.api` 中增加 `POST /api/v1/system/file/upload` 路由定义与响应类型
- [x] 3.2 运行 `just gen-gateway` 并实现 `upload_file_logic.go` 表单文件解析与调用 Driver 上传
- [x] 3.3 在 `app/gateway/gateway.go` 中挂载静态文件目录代理，支持直接访问 `/uploads/*` 资源
- [x] 3.4 运行 `just gen-ts` 生成前端 `@zero/api` SDK

## 4. 全栈验证与端到端验收

- [x] 4.1 启动编译网关，通过 API / PowerShell 测试脚本验证真实文件上传、SHA-256 去重与安全拦截
- [x] 4.2 验证浏览器直接通过静态 URL 加载上传的图片与资源
- [x] 4.3 运行 `just test-frontend` 与 `just lint-antd` 确保项目各端 0 报错
