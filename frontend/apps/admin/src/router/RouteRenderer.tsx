import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthGuard } from "../components/AuthGuard";
import { BasicLayout } from "../layouts/BasicLayout";
import { PageLoading } from "../components/PageLoading";
import { useAuth } from "../contexts/AuthContext";
import { getAccess } from "../access";
import type { AppRouteItem } from "../config/routes.types";

const Exception403 = React.lazy(() => import("../pages/Exception/403"));

/**
 * 带有权限判定拦截的组件包裹器
 */
const RouteAccessWrapper: React.FC<{
  access?: string;
  element: React.ReactElement;
}> = ({ access, element }) => {
  const { profile } = useAuth();
  const accessInstance = getAccess(profile);

  if (access && !accessInstance.canAccess(access)) {
    return <Exception403 />;
  }

  return element;
};

/**
 * React.lazy 异步组件包裹器（提供 Suspense 骨架占位与 403 权限守卫）
 */
const LazyWrapper: React.FC<{
  Component: React.ComponentType<any> | React.LazyExoticComponent<any>;
  access?: string;
}> = ({ Component, access }) => {
  return (
    <Suspense fallback={<PageLoading />}>
      <RouteAccessWrapper access={access} element={<Component />} />
    </Suspense>
  );
};

/**
 * 将绝对路径转换为匹配当前层级父路径的相对路径
 */
function toRelativePath(path: string, parentPath: string): string {
  if (!path.startsWith("/")) return path;
  if (parentPath === "/" || !parentPath) {
    return path.replace(/^\//, "");
  }
  if (path.startsWith(parentPath + "/")) {
    return path.slice(parentPath.length + 1);
  }
  return path.replace(/^\//, "");
}

/**
 * 递归渲染嵌套路由节点
 */
function renderRouteNodes(items: AppRouteItem[], parentPath = ""): React.ReactNode {
  return items.map((item, idx) => {
    const key = `${item.path}_${idx}`;
    const relPath = toRelativePath(item.path, parentPath);
    const isIndex = item.path === parentPath || (parentPath === "/" && item.path === "/");

    // 1. 重定向路由
    if (item.redirect) {
      if (isIndex) {
        return <Route key={key} index element={<Navigate to={item.redirect} replace />} />;
      }
      return (
        <Route
          key={key}
          path={relPath}
          element={<Navigate to={item.redirect} replace />}
        />
      );
    }

    // 2. 嵌套子路由
    if (item.routes && item.routes.length > 0) {
      return (
        <Route key={key} path={relPath}>
          {renderRouteNodes(item.routes, item.path)}
        </Route>
      );
    }

    // 3. 叶子页面节点
    if (item.component) {
      if (isIndex) {
        return (
          <Route
            key={key}
            index
            element={<LazyWrapper Component={item.component} access={item.access} />}
          />
        );
      }
      return (
        <Route
          key={key}
          path={relPath}
          element={<LazyWrapper Component={item.component} access={item.access} />}
        />
      );
    }

    return null;
  });
}

/**
 * 通用声明式路由解析与渲染组件
 */
export const RouteRenderer: React.FC<{ routes: AppRouteItem[] }> = ({ routes }) => {
  // 分离脱离主布局的独立路由（如 /login）、主布局路由（layout !== false）、兜底路由
  const publicRoutes = routes.filter((r) => r.layout === false && r.path !== "*");
  const mainShellRoutes = routes.find((r) => r.layout === true && r.path === "/");
  const fallbackRoute = routes.find((r) => r.path === "*");

  return (
    <Routes>
      {/* 1. 脱离 BasicLayout 的公开页面（如登录页） */}
      {publicRoutes.map((r, idx) => (
        <Route
          key={`pub_${r.path}_${idx}`}
          path={r.path}
          element={
            r.component ? (
              <Suspense fallback={<PageLoading />}>
                <r.component />
              </Suspense>
            ) : null
          }
        />
      ))}

      {/* 2. 受 AuthGuard 登录守卫保护，且嵌套在 BasicLayout 中的业务路由 */}
      {mainShellRoutes && (
        <Route path="/" element={<AuthGuard />}>
          <Route element={<BasicLayout />}>
            {mainShellRoutes.routes && renderRouteNodes(mainShellRoutes.routes, "/")}
          </Route>
        </Route>
      )}

      {/* 3. 兜底未匹配路由 (支持 component 渲染与 redirect 跳转) */}
      {fallbackRoute && fallbackRoute.component && (
        <Route
          path="*"
          element={
            <Suspense fallback={<PageLoading />}>
              <fallbackRoute.component />
            </Suspense>
          }
        />
      )}
      {fallbackRoute && fallbackRoute.redirect && (
        <Route path="*" element={<Navigate to={fallbackRoute.redirect} replace />} />
      )}
    </Routes>
  );
};

export default RouteRenderer;
