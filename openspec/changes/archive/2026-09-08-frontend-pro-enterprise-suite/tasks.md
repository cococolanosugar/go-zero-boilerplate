## 1. 默认配置抽取与品牌资产中心 (defaultSettings)

- [x] 1.1 创建 `frontend/apps/admin/src/config/defaultSettings.ts`，导出强类型 `defaultSettings` 对象（包含 navTheme、colorPrimary、layout: "mix"、title、logo 等），并在 `LayoutSettingsContext.tsx` 与 `app.tsx` 中统筹消费
- [x] 1.2 创建 `frontend/apps/portal/src/config/defaultSettings.ts`，统筹门户端默认主题色与品牌元数据配置

## 2. 导航栏右侧菜单组件化与瘦身 (RightContent)

- [x] 2.1 创建 `frontend/apps/admin/src/components/RightContent/SelectLang.tsx` 与 `ThemeSwitch.tsx` 独立组件
- [x] 2.2 创建 `frontend/apps/admin/src/components/RightContent/AvatarDropdown.tsx` 独立组件，集成用户身份 Tag、个人设置跳转链接与登出处理
- [x] 2.3 创建 `frontend/apps/admin/src/components/RightContent/NoticeIcon.tsx` 消息中心组件，集成通知、消息、待办三栏 Popover、未读计数与已读交互
- [x] 2.4 在 `frontend/apps/admin/src/components/RightContent/index.ts` 聚合导出，并重构 `frontend/apps/admin/src/app.tsx` 彻底移除内联代码，精简为纯粹装配

## 3. 个人中心与安全设置页 (/account/settings)

- [x] 3.1 创建 `frontend/apps/admin/src/pages/Account/Settings/BaseView.tsx`（基本信息展示与编辑）与 `SecurityView.tsx`（安全设置与密码修改表单）
- [x] 3.2 创建 `frontend/apps/admin/src/pages/Account/Settings/index.tsx` 个人设置页面主容器，并注册进 `frontend/apps/admin/src/config/routes.ts`
- [x] 3.3 在 `AvatarDropdown` 中将“个人中心/个人设置”链接绑定至 `/account/settings` 路由

## 4. 可视化大盘与指标监控增强 (/dashboard)

- [x] 4.1 增强 `frontend/apps/admin/src/pages/Dashboard/index.tsx`，引入业务趋势可视化条、访问统计分析环形占比与订单转化进度监控
- [x] 4.2 执行 `pnpm --filter @zero/admin build` 与 `pnpm --filter @zero/portal build` 验证全端 TypeScript 编译与 Vite 打包通过
- [x] 4.3 执行 `just lint-antd` 确保所有新增组件与配置遵循 Ant Design 6.x 规范，0 错误 0 弃用项
