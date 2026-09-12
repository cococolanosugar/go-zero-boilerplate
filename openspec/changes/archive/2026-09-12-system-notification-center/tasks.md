## 1. 数据库版本化迁移 (Atlas)

- [x] 1.1 创建增量迁移文件 `manifest/sql/migrations/20260912000002_create_sys_notice.sql`，定义 `sys_notice` 与 `sys_notice_read` 数据表，执行 `just migrate-up` 并验证表结构就绪

## 2. 全栈 CRUD 底座生成与管理端就绪

- [x] 2.1 运行 `just gen-crud user sys_notice`，一键生成 Model (Cache-Aside)、微服务 RPC CRUD、网关 RESTful API、前端 `@zero/api` SDK 与 ProTable 页面，验证工程编译正常
- [x] 2.2 验证管理后台 `/system/sys-notice` 页面，确保管理员具备通知公告的新增、多条件筛选、修改、下线与删除功能

## 3. 员工端消费接口扩展 (微服务与网关)

- [x] 3.1 在 `app/user/model` 中增加已读记录处理与多分类个人通知流查询方法（按通知/消息/待办分类，计算未读数）
- [x] 3.2 在微服务 `user.proto` 与网关 `desc/user.api` 中追加员工端个人通知流接口（`GET /api/v1/user/notice/my-list`、`POST /api/v1/user/notice/read`、`POST /api/v1/user/notice/read-all`），联动刷新 RPC、网关与前端 SDK

## 4. 前端 NoticeIcon 动态集成与端到端实操验证

- [x] 4.1 将 `frontend/apps/admin/src/components/RightContent/NoticeIcon.tsx` 从静态 Mock 切换为实时调用网关接口，呈现未读 Badge、分类列表、单条已读消除与一键全部已读
- [x] 4.2 执行 `just lint-antd` 确保 0 警告，执行 `just test-frontend` 确保单元测试 100% 通过
- [x] 4.3 使用 Chrome DevTools 驱动真实浏览器测试完整流程：在管理端发布一条新通知 -> 右上角 NoticeIcon 实时出现未读 Badge 红点 -> 点击查看详情并标记已读 -> 未读 Badge 实时消减
