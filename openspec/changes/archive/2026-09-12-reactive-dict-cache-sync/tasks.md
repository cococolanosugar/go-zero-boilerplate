## 1. 字典缓存与跨窗口广播基础设施开发

- [x] 1.1 升级 `frontend/apps/admin/src/hooks/useDict.ts`，支持 L1 (Memory) + L2 (LocalStorage) 二级缓存与 TTL
- [x] 1.2 在 `useDict.ts` 中实现 `DictEventEmitter` 响应式事件总线，让组件自动感知字典更新并重绘
- [x] 1.3 引入跨标签页广播同步机制（`BroadcastChannel` + `storage` 事件降级），并在 `notifyDictUpdate` 时自动向全站广播
- [x] 1.4 在 `frontend/apps/admin/src/pages/System/Dicts/index.tsx` 增删改及一键刷新时完整触发广播

## 2. 声明式 Ant Design 6.x 字典组件体系

- [x] 2.1 封装 `frontend/apps/admin/src/components/Dict/DictTag.tsx` 声明式标签组件
- [x] 2.2 封装 `frontend/apps/admin/src/components/Dict/DictBadge.tsx` 声明式徽标组件
- [x] 2.3 封装 `frontend/apps/admin/src/components/Dict/DictSelect.tsx` 声明式下拉组件
- [x] 2.4 在 `frontend/apps/admin/src/components/Dict/index.ts` 导出统一组件入口

## 3. 业务页面消费重构与质量验收

- [x] 3.1 在 `frontend/apps/admin/src/pages/SysNotice/index.tsx` 中应用 `<DictTag />` 与 `<DictBadge />` 替换手工渲染
- [x] 3.2 编写 `frontend/apps/admin/tests/dictCacheSync.test.ts` 单元测试，覆盖二级缓存、跨 Tab 广播与组件渲染
- [x] 3.3 运行 `just lint-antd` 确保 0 警告，运行 `just test-frontend` 确保测试 100% 通过
- [x] 3.4 使用 Chrome DevTools 真机验证跨页面/跨 Tab 字典热更新联动效果与截图
- [x] 3.5 归档 OpenSpec 规范并提交代码
