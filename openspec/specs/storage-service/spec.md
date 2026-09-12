# Storage Service Specification

## Purpose

提供开箱即用、安全可靠且支持多驱动插拔的通用对象存储与文件上传服务，支持哈希秒传、类型黑白名单校验、静态文件代理与上传审计。

## Requirements

### Requirement: 通用存储驱动抽象与本地实现
系统 SHALL 提供统一的 `Driver` 存储接口，默认内置 `LocalStorageDriver`，支持将文件安全持久化至本地磁盘并映射为统一访问 URL。

#### Scenario: 成功保存本地文件
- **WHEN** 客户端上传有效的文件二进制流
- **THEN** 存储驱动按年月日分级目录存储文件，计算 SHA-256 哈希值并返回完整访问 URL

### Requirement: 文件上传安全防护与校验
系统 SHALL 在处理上传流时执行严格的文件安全校验，包含尺寸上限与危险扩展名黑名单过滤。

#### Scenario: 拦截危险可执行文件
- **WHEN** 用户尝试上传扩展名为 `.exe`、`.sh`、`.bat`、`.cmd`、`.php` 的文件
- **THEN** 系统立即阻断上传并返回“禁止上传可执行或危险脚本文件”业务错误

#### Scenario: 校验文件大小超限
- **WHEN** 上传文件大小超过配置阈值（如 20MB）
- **THEN** 系统中断读取并返回文件超限错误

### Requirement: 网关文件上传与静态资源代理
系统网关 SHALL 暴露 `POST /api/v1/system/file/upload` 接口接收 `multipart/form-data` 请求，并挂载静态目录路由使浏览器能够直接通过 URL 访问图片和附件。

#### Scenario: 上传文件并直接在浏览器加载
- **WHEN** 客户端发起 POST 上传并在返回中获取图片 URL `/uploads/2026/09/12/xxx.png`
- **THEN** 浏览器访问该 URL 能正确获取图片并渲染
