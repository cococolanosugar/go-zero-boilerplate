import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { TitanLayout } from "../layouts/TitanLayout";
import { PageLoading } from "../components/PageLoading";
import { ErrorBoundary } from "../components/ErrorBoundary";
import type { AppRouteItem } from "../config/routes.types";

const LazyWrapper: React.FC<{
  Component: React.ComponentType<any> | React.LazyExoticComponent<any>;
}> = ({ Component }) => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoading />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
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
        return (
          <Route
            key={key}
            index
            element={<LazyWrapper Component={item.component} />}
          />
        );
      }
      return (
        <Route
          key={key}
          path={relPath}
          element={<LazyWrapper Component={item.component} />}
        />
      );
    }

    return null;
  });
}

export const RouteRenderer: React.FC<{ routes: AppRouteItem[] }> = ({ routes }) => {
  const layoutRoute = routes.find((r) => r.layout);
  const nonLayoutRoutes = routes.filter((r) => !r.layout);

  return (
    <Routes>
      {/* 挂载应用主 Layout */}
      {layoutRoute && (
        <Route path="/" element={<TitanLayout />}>
          {layoutRoute.routes ? renderRouteNodes(layoutRoute.routes, "/") : null}
        </Route>
      )}

      {/* 独立页面 (如登录、SSO 回调、404) */}
      {renderRouteNodes(nonLayoutRoutes, "")}
    </Routes>
  );
};

export default RouteRenderer;
