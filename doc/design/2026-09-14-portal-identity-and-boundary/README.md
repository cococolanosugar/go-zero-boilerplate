# Portal 设计审查与优化调整方案

> 状态：第一阶段已落地归档 (Archived)
> 日期：2026-09-14
> 范围：`frontend/apps/portal` 及其在网关侧的身份/接口边界
> 落地变更：`openspec/changes/archive/2026-09-14-portal-identity-and-api-boundary`

---

## 1. 背景

Portal 早期定位模糊，同时扮演三个互相冲突的角色：

1. **官网/营销门户** —— Home / Navigation / Services
2. **admin 演示壳** —— Workbench 直调内部系统管理接口做 API 测试场
3. **轻量移动端** —— localStorage `portal_login_type=mobile` 的双模态身份

业界常识要求三者择一。本方案按「现状问题 → 定位决策 → 分步调整」组织。

---

## 2. 现状问题清单与整改对比

### 2.1 🔴 身份域直接复用 admin（已解决）

| 位置 | 改造前问题 | 改造后规范 |
|---|---|---|
| `src/contexts/InitialStateContext.tsx` | `PortalInitialState.currentUser` 为 `AdminProfileResp` | 升级为通用 `UserProfileResp`，脱离 admin 专属模型 |
| `src/app.tsx`（getInitialState） | 登录态依赖调用 `getAdminProfile()` | 统一调用网关 `getUserProfile()` 服务端权威双表解析 |
| `src/services/index.ts` | re-export `systemUsersApi` / `systemRolesApi` 等全部 admin API | 彻底剪除全部后台管理 API 导出，杜绝能力泄漏 |

### 2.2 🔴 前端伪造身份（已彻底解决）

* **改造前**：只要 localStorage 标记 `mobile`，前端即自行构造用户画像（甚至凭空捏造 `{id:0, roles:["ROLE_USER"]}`）。
* **改造后**：所有身份数据 100% 来源于网关 `GET /api/v1/user/profile`，未登录或失效时统一置为 `null`，零本地对象伪造。

### 2.3 🟡 Workbench 演示与接口边界（已解决）

* **改造前**：Workbench 演示 `getSysMenuTree()` / `listSysApis()` / `getAdminProfile()` —— 给访客演示内部菜单权限树与 B 端管理接口。
* **改造后**：Workbench 全面切换为门户领域真实接口（大盘聚合 `getDashboardOverview`、统一双表画像 `getUserProfile`、前台多环境网址导航 `getPortalNavList`、业务客户信息 `getUserInfo`）。

### 2.4 🟢 声明式权限判定强化（已解决）

* `access.ts` 移除 `profile?.id === 1` 魔法数字超管判定，严格基于角色列表匹配；并在文件头部明确标注「UI 判定仅用于视图层路由和菜单展示，后端网关 RBAC 中间件为最终安全防线」。

---

## 3. 定位决策与长期演进路径

| 步骤 | 内容 | 状态 |
|---|---|---|
| **第一阶段：身份域分离与接口边界收口** | 网关 `user.api` 补充 `getUserProfile` 双表兜底；Portal 类型与初始化全面解耦；移除 dummy 用户；剪裁 admin 接口；Workbench 重构 | **已完成并归档** |
| **第二阶段：布局与页面形态演进** | PortalLayout 顶部导航 + 全宽内容流；Home 首页由数据大盘向品牌 Hero + 核心服务卡片升级 | 后续规划 |
| **第三阶段：SEO 与工程深度治理** | 动态 Meta 注入；基础组件共享下沉 `packages/shared` | 后续规划 |

---

## 4. 第一阶段验收对照表

- [x] portal 前端代码中不存在 `AdminProfileResp` 类型引用与 `getAdminProfile` 调用
- [x] portal 前端不存在任何 system*Api（users/roles/menus/apis/logs）导入与再导出
- [x] 无 localStorage 驱动的身份/角色构造路径；身份画像全部来自服务端接口
- [x] `access.ts` 无魔法数字判定，且注明「仅 UI 展示控制」
- [x] 单元测试 35/35 套件 154/154 测试用例 100% 通过
