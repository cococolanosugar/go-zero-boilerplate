import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { PortalLayout } from "../layouts/PortalLayout";
import { PageLoading } from "../components/PageLoading";
import type { AppRouteItem } from "../config/routes.types";

const LazyWrapper: React.FC<{
  Component: React.ComponentType<any> | React.LazyExoticComponent<any>;
}> = ({ Component }) => {
  return (
    <Suspense fallback={<PageLoading />}>
      <Component />
    </Suspense>
  );
};

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

function renderRouteNodes(items: AppRouteItem[], parentPath = ""): React.ReactNode {
  return items.map((item, idx) => {
    const key = `${item.path}_${idx}`;
    const relPath = toRelativePath(item.path, parentPath);
    const isIndex = item.path === parentPath || (parentPath === "/" && item.path === "/");

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

    if (item.routes && item.routes.length > 0) {
      return (
        <Route key={key} path={relPath}>
          {renderRouteNodes(item.routes, item.path)}
        </Route>
      );
    }

    if (item.component) {
      if (isIndex) {
        return <Route key={key} index element={<LazyWrapper Component={item.component} />} />;
      }
      return <Route key={key} path={relPath} element={<LazyWrapper Component={item.component} />} />;
    }

    return null;
  });
}

/**
 * 门户声明式路由渲染器
 */
export const RouteRenderer: React.FC<{ routes: AppRouteItem[] }> = ({ routes }) => {
  const publicRoutes = routes.filter((r) => r.layout === false && r.path !== "*");
  const mainShellRoutes = routes.find((r) => r.layout === true && r.path === "/");
  const fallbackRoute = routes.find((r) => r.path === "*");

  return (
    <Routes>
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

      {mainShellRoutes && (
        <Route path="/" element={<PortalLayout />}>
          {mainShellRoutes.routes && renderRouteNodes(mainShellRoutes.routes, "/")}
        </Route>
      )}

      {fallbackRoute && fallbackRoute.redirect && (
        <Route path="*" element={<Navigate to={fallbackRoute.redirect} replace />} />
      )}
    </Routes>
  );
};

export default RouteRenderer;
