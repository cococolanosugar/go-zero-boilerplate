## Context

当前项目已具备编译时声明式路由（`config/routes.ts`）与声明式权限判定（`access.ts`）。但在应用启动生命周期与布局渲染上，业务插槽配置（头像、下拉、水印、设置抽屉、导航右侧按钮等）全量混合在 `BasicLayout.tsx` 与 `PortalLayout.tsx` 组件中。详见 [proposal.md](proposal.md)。

## Goals / Non-Goals

**Goals:**
- 在 `frontend/apps/admin` 与 `frontend/apps/portal` 中确立统一的运行时配置文件 `src/app.tsx`。
- 实现与 Ant Design Pro 一致的 `getInitialState()` 异步初始化生命周期，统一管理 `currentUser`、`permissions`、`roles`、`menus`。
- 实现与 Ant Design Pro 一致的 `layout()` 运行时配置函数导出，将所有布局插槽业务逻辑与 UI 容器解耦。
- 实现通用的 `InitialStateContext` 与 `useInitialState()` Hook，支持跨组件动态更新状态（如修改个人信息、退出登录）。
- 将 `BasicLayout.tsx` 与 `PortalLayout.tsx` 大幅精简为无状态的轻量渲染骨架。

**Non-Goals:**
- 不引入 `@umijs/max` 框架黑盒，完全基于原生 React 18 Context 与 Hooks 机制实现。
- 不修改现有的 `config/routes.ts` 声明式编译时路由规则与 API 契约。

## Decisions

### 1. 运行时配置接口与签名定义 (`src/app.tsx`)
```typescript
export interface InitialState {
  currentUser?: AdminProfileResp | null;
  permissions?: string[];
  roles?: string[];
  menus?: SysMenuItem[];
  settings?: ProSettings;
  loading?: boolean;
}

export type RunTimeLayoutConfig = (context: {
  initialState: InitialState;
  setInitialState: React.Dispatch<React.SetStateAction<InitialState>>;
  navigate: (to: string, options?: any) => void;
  formatMessage: (descriptor: { id: string; defaultMessage?: string }) => string;
  isDark?: boolean;
  toggleNavTheme?: () => void;
  message: any;
}) => ProLayoutProps & { routeData?: any };
```

### 2. 全局状态容器设计 (`InitialStateContext`)
封装 `<InitialStateProvider getInitialState={getInitialState}>`：
- 在应用挂载时统一触发 `getInitialState()` 并维护 `initialState`。
- 提供 `useInitialState()` Hook，返回 `{ initialState, setInitialState, refreshInitialState }`。

### 3. Layout 组件纯粹化架构
`BasicLayout.tsx` 与 `PortalLayout.tsx` 的实现模式转变为：
```tsx
export const BasicLayout: React.FC = () => {
  const { initialState, setInitialState } = useInitialState();
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const { message } = AntdApp.useApp();
  const { settings, toggleNavTheme, isDark } = useLayoutSettings();

  const layoutConfig = useMemo(() => {
    return layout({
      initialState,
      setInitialState,
      navigate,
      formatMessage,
      isDark,
      toggleNavTheme,
      message,
    });
  }, [initialState, isDark, settings, locale]);

  return (
    <ProLayout {...layoutConfig} route={layoutConfig.routeData}>
      <Outlet />
    </ProLayout>
  );
};
```
该模式将数百行业务配置从视图中剔除，使布局容器聚焦于视图层。

## Risks / Trade-offs

- **[Risk] 初始化接口延迟导致的首屏阻塞**
  → *Mitigation*: 在 `getInitialState()` 中，若本地无 Token 则瞬间同步返回空状态；若存在 Token，展示极简的全局 `PageLoading` 直至初始画像就绪，防止页面跳动。
