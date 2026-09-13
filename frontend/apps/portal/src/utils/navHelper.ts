import type { PortalNavDTO } from "@zero/api";

/**
 * 动态替换导航 URL 中的 {HOST} 占位符
 * 自适应当前访问域名或内网 IP（如 192.168.x.x 或 localhost）
 */
export function resolveNavUrl(url: string, currentHost?: string): string {
  if (!url) return "";
  let host =
    currentHost !== undefined && currentHost !== "" ? currentHost : undefined;
  if (!host) {
    host =
      typeof window !== "undefined" && window.location?.hostname
        ? window.location.hostname
        : "127.0.0.1";
  }
  if (!host) {
    host = "127.0.0.1";
  }
  return url.replace(/\{HOST\}/g, host);
}

/**
 * 导航站点搜索与分类/环境过滤纯函数
 */
export function filterNavList(
  list: PortalNavDTO[] = [],
  selectedCategory = "ALL",
  searchKeyword = "",
  selectedEnv = "ALL"
): PortalNavDTO[] {
  return list.filter((item) => {
    // 过滤未启用站点
    if (item.status !== 1) return false;

    // 环境分组筛选
    if (
      selectedEnv &&
      selectedEnv !== "ALL" &&
      (item.env || "common") !== selectedEnv
    ) {
      return false;
    }

    // 分类筛选
    if (
      selectedCategory &&
      selectedCategory !== "ALL" &&
      item.category !== selectedCategory
    ) {
      return false;
    }

    // 关键词多维度匹配（标题、描述、分类、标签、URL、环境）
    if (searchKeyword && searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(kw);
      const matchDesc = item.description?.toLowerCase().includes(kw);
      const matchTags = item.tags?.toLowerCase().includes(kw);
      const matchCategory = item.category?.toLowerCase().includes(kw);
      const matchUrl = item.url?.toLowerCase().includes(kw);
      const matchEnv = item.env?.toLowerCase().includes(kw);
      return Boolean(matchTitle || matchDesc || matchTags || matchCategory || matchUrl || matchEnv);
    }

    return true;
  });
}

