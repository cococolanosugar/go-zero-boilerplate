# Design: 通用对象存储与文件上传服务 (pkg/storage & sys_file) 全栈架构设计

## 1. 架构目标与抽象模型

本设计借鉴 RuoYi OSS 与企业级微服务架构：
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
| LocalStorageDriver    |                       | (Extensible Drivers)  |
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

## 2. 核心接口与驱动实现 (`pkg/storage`)

### 2.1 驱动接口定义
```go
package storage

import (
	"context"
	"io"
)

type FileInfo struct {
	OriginalName string `json:"originalName"`
	Filename     string `json:"filename"`
	Path         string `json:"path"`
	Url          string `json:"url"`
	Size         int64  `json:"size"`
	MimeType     string `json:"mimeType"`
	Hash         string `json:"hash"`
}

type Driver interface {
	Upload(ctx context.Context, reader io.Reader, originalName string, size int64, mimeType string) (*FileInfo, error)
	Delete(ctx context.Context, path string) error
	GetUrl(ctx context.Context, path string) string
}
```

### 2.2 安全黑名单机制
危险文件后缀白名单/黑名单：
禁止 `.exe`, `.bat`, `.cmd`, `.sh`, `.php`, `.jsp`, `.asp`, `.py` 等可执行文件，防止服务器提权与代码注入。

---

## 3. 网关与文件服务路由

1. **上传 API**:
   - `POST /api/v1/system/file/upload`
   - 入参：`multipart/form-data`，表单字段名 `file`。
   - 返回结构：
     ```json
     {
       "code": 200,
       "msg": "SUCCESS",
       "data": {
         "url": "/uploads/2026/09/12/abc12345.png",
         "filename": "abc12345.png",
         "originalName": "avatar.png",
         "size": 10240,
         "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
       }
     }
     ```
2. **静态文件服务**:
   - 网关挂载 `http.StripPrefix("/uploads/", http.FileServer(http.Dir("./data/uploads")))`，实现免鉴权静态资源直出。
