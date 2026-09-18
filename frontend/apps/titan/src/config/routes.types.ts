import type { ComponentType, LazyExoticComponent } from "react";

export interface AppRouteItem {
  path: string;
  name?: string;
  locale?: string;
  icon?: string;
  component?: LazyExoticComponent<ComponentType<any>> | ComponentType<any>;
  layout?: boolean;
  hideInMenu?: boolean;
  redirect?: string;
  routes?: AppRouteItem[];
}
