## 1. 核心布局与设置抽屉增强

- [x] 1.1 在 `frontend/apps/admin/src/app.tsx` 中配置自适应双行防截屏水印（含员工画像、系统标语与暗色模式透明度切换）
- [x] 1.2 在 `frontend/apps/admin/src/layouts/BasicLayout.tsx` 的 `SettingDrawer` footer 中挂载水印开关与多标签页开关
- [x] 1.3 确保全仓 `just lint-antd` 0 警告与 `tsc --noEmit` 通过

## 2. 自动化测试与真机验收

- [x] 2.1 编写 `frontend/apps/admin/tests/watermark.test.ts` 验证水印属性生成、暗色模式色彩切换与配置持久化
- [x] 2.2 运行 `just test-frontend` 确保 100% 通过
- [x] 2.3 使用 Chrome DevTools 检查 SettingDrawer 开关与页面水印展示，截图并归档
- [x] 2.4 归档 OpenSpec 规范并提交推送
