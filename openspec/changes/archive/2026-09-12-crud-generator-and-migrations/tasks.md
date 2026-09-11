## 1. 数据库版本化迁移工作流 (Database Migrations)

- [x] 1.1 创建 `manifest/sql/migrations/` 目录，将现有的 `manifest/sql/init.sql` 结构提炼为初始基线迁移文件 `20260912000000_baseline.sql`，并通过 `atlas` 校验语法
- [x] 1.2 在 `justfile` 与 `Makefile` 中集成迁移指令（`migrate-new`, `migrate-up`, `migrate-down`, `migrate-status`），并执行 `just migrate-status` 验证连通性

## 2. 代码生成引擎核心与元数据解析 (CRUD Generator Core)

- [x] 2.1 在 `hack/generator` 创建 Go CLI 工具，实现 MySQL `information_schema` 表结构解析模块（提取列名、类型、注释、主键、是否可空），并编写单元测试验证类型映射正确性
- [x] 2.2 编写微服务 Model 扩展模板，生成支持 Cache-Aside、多条件动态拼接与真分页查询的 `_model_custom.go`
- [x] 2.3 编写微服务 Proto 与 RPC 桩代码生成逻辑，在目标服务的 `.proto` 中声明 CRUD 消息与 RPC 方法，并联动调用 `just gen-rpc`
- [x] 2.4 编写网关 API 契约与 BFF Logic 生成逻辑，在网关 `desc/<service>.api` 中追加 RESTful 路由，并联动调用 `just gen-gateway`

## 3. 前端 ProTable 代码生成与 SDK 联动

- [x] 3.1 编写符合 Ant Design 6.x 与 ProComponents 2.8.10 规范的前端页面模板，生成包含多条件筛选、新建/编辑 Modal 表单、批量删除确认、详情抽屉与权限受控按钮的业务页面
- [x] 3.2 串联前端 SDK 自动化生成：生成代码时联动执行 `just gen-ts` 同步 `@zero/api`，并在管理后台 `apps/admin/src/config/routes.ts` 中输出路由挂载配置提示

## 4. 端到端实战验证与回归检测 (E2E Validation & Compliance)

- [x] 4.1 使用脚手架已有数据表 `sys_post` 全流程运行 `just gen-crud user sys_post`，验证 Model、RPC、Gateway 与前端页面完整输出
- [x] 4.2 执行 `just lint-antd` 确保生成的 ProTable 前端代码 0 警告 0 废弃语法，并执行 `just test-frontend` 确保全仓前端单测 100% 通过
- [x] 4.3 编译并启动微服务与网关，验证完整的岗位新增、列表检索、修改与删除闭环功能
