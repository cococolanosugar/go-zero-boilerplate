# 通用对象存储与文件上传服务设计方案 (Universal Storage Service & pkg/storage)

本文档记录 `go-zero-boilerplate` 中台架构中通用对象存储驱动抽象、文件上传流式处理、安全防御拦截与网关静态资源代理的设计与落地实现。

---

## 1. 架构总览与设计哲学

在现代企业级微服务中，文件上传与对象存储（如员工头像、合同附件、单据凭证等）必须满足以下三大核心诉求：
1. **多驱动插拔能力**：开发/测试环境开箱即用（本地磁盘存储），生产环境可无缝对接云厂商对象存储（MinIO、阿里云 OSS、AWS S3），业务层无感知。
2. **内容寻址与即时秒传**：计算文件二进制流的 SHA-256 哈希值，实现同内容即时去重复用（Deduplication）。
3. **企业级安全防线**：拦截危险脚本与可执行后缀（`.exe`、`.bat`、`.sh`、`.php` 等），限制最大尺寸，防御路径穿越（Path Traversal）。

```text
                  +-----------------------------------+
                  |      Unified Gateway (:8888)      |
                  |  POST /api/v1/system/file/upload  |
                  +-----------------+-----------------+
                                    |
                    +---------------+---------------+
                    | pkg/storage.Driver (Interface)|
                    +---------------+---------------+
                                    |
            +-----------------------+-----------------------+
            |                                               |
+-----------v-----------+                       +-----------v-----------+
| LocalStorageDriver    |                       | (Cloud Object Store)  |
| - Local disk writes   |                       | - MinIO S3            |
| - YYYY/MM/DD hierarchy|                       | - Aliyun OSS          |
| - SHA-256 deduplicate |                       | - AWS S3              |
+-----------+-----------+                       +-----------------------+
            |
            v
     /uploads/ static
     file server
```

---

## 2. 核心组件与实现剖析

### 2.1 驱动接口与本地实现 (`pkg/storage`)
- **通用抽象接口**：
  ```go
  type Driver interface {
      Upload(ctx context.Context, reader io.Reader, originalName string, size int64, mimeType string) (*FileInfo, error)
      Delete(ctx context.Context, path string) error
      GetUrl(ctx context.Context, path string) string
  }
  ```
- **分级目录与命名**：
  文件按照 `YYYY/MM/DD/<hash><ext>` 存储，天然避免单目录文件过多导致的 inode 检索瓶颈，同时保证文件天然具备基于内容哈希的唯一性与幂等性。
- **即时去重（秒传）**：
  当上传相同哈希文件时，驱动直接返回已存在的物理文件信息，节约磁盘存储并提升上传吞吐。

### 2.2 安全拦截机制
- **危险扩展名黑名单**：
  严格拦截 `.exe`, `.bat`, `.cmd`, `.sh`, `.bash`, `.php`, `.jsp`, `.asp`, `.aspx`, `.py`, `.ps1` 等可执行文件，防止恶意脚本注入。
- **文件体积防护**：
  通过 `io.LimitReader` 实施双重尺寸上限校验（默认 20MB），防止恶意大文件耗尽服务器磁盘或内存。
- **路径穿越防御**：
  在 `Delete` 等操作中对路径进行 `filepath.Clean` 与 `..` 检测，杜绝任意文件删除隐患。

### 2.3 网关 BFF 与静态代理
- **RESTful 端点**：`POST /api/v1/system/file/upload`
- **静态资源直出**：
  在网关启动入口挂载 `rest.WithNotFoundHandler`，当匹配 `/uploads/*` 前缀时自动代理本地 `./data/uploads` 目录，并补充跨域头 `Access-Control-Allow-Origin: *`，使前端浏览器与第三方客户端可直接加载回显图片。

### 2.4 前端 SDK 封装 (`@zero/api`)
- 扩展 `gocliRequest.ts`，原生识别 `FormData` 实例并自动移除硬编码的 `application/json`，让浏览器原生计算包含 boundary 的 `multipart/form-data`。
- 在 `@zero/api` 导出便捷助手函数 `uploadSingleFile(file: File | FormData)`，开箱即用。

---

## 3. 全栈端到端测试与验证

自动化测试脚本已通过以下全面验收：
1. **正常上传与回显**：上传 PNG 图片获取 URL，通过 HTTP GET 校验状态码 200 与二进制字节一致性。
2. **秒传去重**：再次上传同一文件，直接命中相同 SHA-256 哈希与 URL。
3. **恶意文件拦截**：上传可执行文件被安全拦截并返回错误码 `300003`（"禁止上传可执行或危险脚本文件"）。
4. **单元测试矩阵**：82 项前端单元测试 100% 通过，Ant Design 代码 0 警告。
