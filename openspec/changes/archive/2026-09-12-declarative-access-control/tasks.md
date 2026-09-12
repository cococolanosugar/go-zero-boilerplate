## 1. 核心 Hook 与组件升级

- [x] 1.1 创建 `frontend/apps/admin/src/hooks/useAccess.ts` 并结合 `InitialStateContext` 与 `src/access.ts`
- [x] 1.2 升级 `frontend/apps/admin/src/components/Access.tsx`，使其消费 `useAccess`，确保在 `Root` 单根下完美运行
- [x] 1.3 在 `frontend/apps/admin/src/components/index.ts` 导出 `Access` 与 `useAccess`
- [x] 1.4 在 `frontend/apps/admin/src/hooks/index.ts`（若有）统一导出 `useAccess`

## 2. 业务页面集成示范

- [x] 2.1 在 `frontend/apps/admin/src/pages/System/Users/index.tsx` 中应用 `<Access>` 与 `useAccess` 保护新增员工与操作按钮
- [x] 2.2 确保 `just lint-antd` 0 警告

## 3. 单元测试与验证归档

- [x] 3.1 编写 `frontend/apps/admin/tests/accessComponent.test.tsx` 验证 `<Access>` 与 `useAccess` 各种场景（普通用户、超管、隐藏、禁用气泡）
- [x] 3.2 运行 `just test-frontend` 确保 100% 通过
- [x] 3.3 归档 OpenSpec 规范并提交推送
