import { describe, it, expect } from "vitest";
import { resolveNavUrl, filterNavList } from "../src/utils/navHelper";
import type { PortalNavDTO } from "@zero/api";

describe("Portal Navigation Helper & Filter Tests", () => {
  const mockNavList: PortalNavDTO[] = [
    {
      id: 1,
      title: "Temporal Web 控制台",
      category: "任务引擎",
      url: "http://{HOST}:8233",
      icon: "CloudServerOutlined",
      description: "分布式工作流与异步任务编排执行可视化监控面板",
      tags: "Temporal,Saga,Cron",
      sort: 100,
      target: "_blank",
      status: 1,
      env: "dev",
      createTime: "2026-09-13 12:00:00",
      updateTime: "2026-09-13 12:00:00",
    },
    {
      id: 2,
      title: "Nacos 服务注册中心",
      category: "服务治理",
      url: "http://{HOST}:8848/nacos",
      icon: "SafetyCertificateOutlined",
      description: "微服务注册、健康心跳探测与动态配置下发管理控制台",
      tags: "Nacos,gRPC,Registry",
      sort: 90,
      target: "_blank",
      status: 1,
      env: "prod",
      createTime: "2026-09-13 12:00:00",
      updateTime: "2026-09-13 12:00:00",
    },
    {
      id: 3,
      title: "外部公共镜像仓库",
      category: "开发文档",
      url: "https://hub.docker.com",
      icon: "GlobalOutlined",
      description: "容器镜像托管中心",
      tags: "Docker,Image",
      sort: 80,
      target: "_blank",
      status: 0, // 未启用状态
      env: "common",
      createTime: "2026-09-13 12:00:00",
      updateTime: "2026-09-13 12:00:00",
    },
    {
      id: 4,
      title: "Casdoor 认证中心",
      category: "身份认证",
      url: "http://{HOST}:8000",
      icon: "KeyOutlined",
      description: "单点登录通行证管理中心",
      tags: "IAM,SSO",
      sort: 70,
      target: "_blank",
      status: 1,
      env: "common",
      createTime: "2026-09-13 12:00:00",
      updateTime: "2026-09-13 12:00:00",
    },
  ];

  describe("resolveNavUrl", () => {
    it("should replace {HOST} with specified custom host", () => {
      const result = resolveNavUrl("http://{HOST}:8233", "192.168.31.174");
      expect(result).toBe("http://192.168.31.174:8233");
    });

    it("should replace {HOST} with browser location hostname in environment", () => {
      const result = resolveNavUrl("http://{HOST}:8848/nacos");
      expect(result).toBe(`http://${window.location.hostname}:8848/nacos`);
    });

    it("should leave standard URLs without {HOST} unchanged", () => {
      const result = resolveNavUrl("https://hub.docker.com", "192.168.31.174");
      expect(result).toBe("https://hub.docker.com");
    });

    it("should return empty string when input is empty", () => {
      expect(resolveNavUrl("")).toBe("");
    });
  });

  describe("filterNavList", () => {
    it("should filter out disabled status items (status !== 1)", () => {
      const result = filterNavList(mockNavList, "ALL", "", "ALL");
      expect(result.length).toBe(3);
      expect(result.some((item) => item.id === 3)).toBe(false);
    });

    it("should filter items by category accurately", () => {
      const result = filterNavList(mockNavList, "任务引擎", "", "ALL");
      expect(result.length).toBe(1);
      expect(result[0].title).toBe("Temporal Web 控制台");
    });

    it("should filter items by environment accurately", () => {
      const devItems = filterNavList(mockNavList, "ALL", "", "dev");
      expect(devItems.length).toBe(1);
      expect(devItems[0].id).toBe(1);

      const prodItems = filterNavList(mockNavList, "ALL", "", "prod");
      expect(prodItems.length).toBe(1);
      expect(prodItems[0].id).toBe(2);

      const commonItems = filterNavList(mockNavList, "ALL", "", "common");
      expect(commonItems.length).toBe(1);
      expect(commonItems[0].id).toBe(4);
    });

    it("should combine environment and category filters", () => {
      const result = filterNavList(mockNavList, "任务引擎", "", "dev");
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(1);

      const mismatch = filterNavList(mockNavList, "任务引擎", "", "prod");
      expect(mismatch.length).toBe(0);
    });

    it("should match items by keyword across title, description, or tags", () => {
      // By tag
      const tagMatch = filterNavList(mockNavList, "ALL", "Saga");
      expect(tagMatch.length).toBe(1);
      expect(tagMatch[0].id).toBe(1);

      // By description keyword
      const descMatch = filterNavList(mockNavList, "ALL", "心跳探测");
      expect(descMatch.length).toBe(1);
      expect(descMatch[0].id).toBe(2);

      // Case-insensitive
      const caseMatch = filterNavList(mockNavList, "ALL", "temporal");
      expect(caseMatch.length).toBe(1);
      expect(caseMatch[0].id).toBe(1);
    });

    it("should return empty array when no matches found", () => {
      const result = filterNavList(mockNavList, "ALL", "nonexistent-keyword-xyz");
      expect(result.length).toBe(0);
    });
  });
});
