## 1. 通用数据字典 Hook 开发 (useDict)

- [x] 1.1 在 `frontend/apps/admin/src/hooks/useDict.ts` 实现具备内存缓存、请求去重与 TTL 管理的 `useDict` Hook
- [x] 1.2 支持多字典批量加载，自动生成 `options`、`valueEnum`、`getLabel`、`getTagColor`
- [x] 1.3 编写单元测试 `frontend/apps/admin/tests/useDict.test.ts` 验证并发加载、缓存命中与结构映射

## 2. 真实业务页面重构与字典驱动

- [x] 2.1 重构系统通知公告管理页面 (`frontend/apps/admin/src/pages/System/Notice/index.tsx`)，使用 `useDict` 驱动 `noticeType` 与 `status` 的 ProTable 列与表单选择器
- [x] 2.2 确保通知页面在离线 Mock 或无后端时具备安全兜底默认值

## 3. 全面验证与归档

- [x] 3.1 运行 `just test-frontend` 确保所有单元测试 100% 通过
- [x] 3.2 运行 `just lint-antd` 确保 Ant Design 规范 0 警告
- [x] 3.3 在真实浏览器中端到端验证通知管理页面的字典标签渲染与筛选体验
- [x] 3.4 归档 OpenSpec 规范并正式提交推送
