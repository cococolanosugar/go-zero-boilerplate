import { describe, it, expect } from "vitest";
import { BUILTIN_API_CATEGORIES } from "../src/pages/ApiHub/manifest";
import { loadApiCategories, filterCategories, findEndpointById } from "../src/pages/ApiHub/parser";
import {
  generateCodeSnippet,
  buildResolvedUrl,
  generateCurl,
  generateTypeScript,
  generateGo,
  generatePython,
} from "../src/pages/ApiHub/codeGenerator";
import { executeSandboxRequest } from "../src/pages/ApiHub/sandboxRunner";
import type { ApiEndpointVO } from "../src/pages/ApiHub/types";

describe("API Hub Manifest & Parser Tests", () => {
  it("should have comprehensive builtin API categories and endpoints", () => {
    expect(BUILTIN_API_CATEGORIES.length).toBeGreaterThanOrEqual(5);

    const categoryTitles = BUILTIN_API_CATEGORIES.map((c) => c.title);
    expect(categoryTitles).toContain("Titan 研发交付引擎 (Titan RPC)");
    expect(categoryTitles).toContain("ITSM 流程引擎与服务台 (ITSM RPC)");
    expect(categoryTitles).toContain("用户中心与身份凭据 (User RPC)");
    expect(categoryTitles).toContain("异步调度与 Temporal 引擎 (Worker RPC)");

    const totalEndpoints = BUILTIN_API_CATEGORIES.reduce((acc, c) => acc + c.endpoints.length, 0);
    expect(totalEndpoints).toBeGreaterThanOrEqual(15);

    // Verify method and path integrity
    BUILTIN_API_CATEGORIES.forEach((cat) => {
      cat.endpoints.forEach((ep) => {
        expect(["GET", "POST", "PUT", "DELETE", "PATCH"]).toContain(ep.method);
        expect(ep.path.startsWith("/")).toBe(true);
        expect(ep.name).toBeTruthy();
        expect(ep.tagKey).toBe(cat.key);
      });
    });
  });

  it("should load categories and fallback gracefully", async () => {
    const { categories, isLive } = await loadApiCategories();
    expect(categories.length).toBeGreaterThan(0);
    expect(typeof isLive).toBe("boolean");
  });

  it("should filter categories by keyword and method", () => {
    // Filter by keyword "流水线"
    const keywordMatches = filterCategories(BUILTIN_API_CATEGORIES, "流水线", "ALL");
    expect(keywordMatches.length).toBeGreaterThan(0);
    const hasPipeline = keywordMatches.some((cat) =>
      cat.endpoints.some((ep) => ep.name.includes("流水线") || ep.path.includes("pipeline"))
    );
    expect(hasPipeline).toBe(true);

    // Filter by Method "POST"
    const postMatches = filterCategories(BUILTIN_API_CATEGORIES, "", "POST");
    expect(postMatches.length).toBeGreaterThan(0);
    postMatches.forEach((cat) => {
      cat.endpoints.forEach((ep) => {
        expect(ep.method).toBe("POST");
      });
    });

    // Filter by non-existing term
    const noMatches = filterCategories(BUILTIN_API_CATEGORIES, "XYZ_NON_EXISTENT_9999", "ALL");
    expect(noMatches.length).toBe(0);
  });

  it("should find endpoint by id", () => {
    const ep = findEndpointById(BUILTIN_API_CATEGORIES, "titan-list-projects");
    expect(ep).toBeDefined();
    expect(ep?.name).toBe("查询项目空间列表");
    expect(ep?.path).toBe("/api/v1/titan/projects");
  });
});

describe("API Hub Code Generator Tests", () => {
  const sampleEndpoint: ApiEndpointVO = {
    id: "test-get-item",
    tag: "测试模块",
    tagKey: "test",
    method: "GET",
    path: "/api/v1/items/:id",
    name: "获取指定项目详情",
    description: "按 ID 查询项目",
    authRequired: true,
    sdkMethod: "getItemDetail",
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        type: "integer",
        description: "项目主键 ID",
        example: 42,
      },
      {
        name: "view",
        in: "query",
        required: false,
        type: "string",
        description: "展示视图类型",
        example: "detail",
      },
    ],
  };

  it("should correctly resolve path and query parameters", () => {
    const { fullUrl, pathWithParams } = buildResolvedUrl(
      sampleEndpoint,
      { id: 42, view: "detail" },
      "localhost:8888"
    );

    expect(pathWithParams).toBe("/api/v1/items/42?view=detail");
    expect(fullUrl).toBe("http://localhost:8888/api/v1/items/42?view=detail");
  });

  it("should generate 4 languages snippets matching parameter substitutions", () => {
    const headers = { Authorization: "Bearer test-jwt-token" };
    const params = { id: 42, view: "detail" };
    const body = "";

    const curlCode = generateCurl({ endpoint: sampleEndpoint, params, body, headers });
    expect(curlCode).toContain("curl -X GET");
    expect(curlCode).toContain("/api/v1/items/42?view=detail");
    expect(curlCode).toContain("Authorization: Bearer test-jwt-token");

    const tsCode = generateTypeScript({ endpoint: sampleEndpoint, params, body, headers });
    expect(tsCode).toContain("getItemDetail");
    expect(tsCode).toContain("@zero/api");

    const goCode = generateGo({ endpoint: sampleEndpoint, params, body, headers });
    expect(goCode).toContain('http.NewRequestWithContext(ctx, "GET"');
    expect(goCode).toContain("Authorization");

    const pyCode = generatePython({ endpoint: sampleEndpoint, params, body, headers });
    expect(pyCode).toContain('requests.get(');
    expect(pyCode).toContain("Authorization");

    // Also test language dispatcher
    const dispatched = generateCodeSnippet("curl", { endpoint: sampleEndpoint, params, body, headers });
    expect(dispatched).toBe(curlCode);
  });

  it("should generate correct POST snippets with JSON body", () => {
    const postEndpoint: ApiEndpointVO = {
      id: "test-create-item",
      tag: "测试",
      tagKey: "test",
      method: "POST",
      path: "/api/v1/items",
      name: "创建项目",
      authRequired: true,
    };

    const headers = { Authorization: "Bearer token" };
    const body = { name: "production-demo" };

    const curlCode = generateCurl({ endpoint: postEndpoint, params: {}, body, headers });
    expect(curlCode).toContain("-X POST");
    expect(curlCode).toContain('Content-Type: application/json');

    const pyCode = generatePython({ endpoint: postEndpoint, params: {}, body, headers });
    expect(pyCode).toContain('requests.post(');
    expect(pyCode).toContain('json=payload');

    const goCode = generateGo({ endpoint: postEndpoint, params: {}, body, headers });
    expect(goCode).toContain('strings.NewReader');
    expect(goCode).toContain('req.Header.Set("Content-Type", "application/json")');
  });
});

describe("API Hub Sandbox Runner Tests", () => {
  it("should generate sandbox execution with valid curl and latency handling", async () => {
    const endpoint: ApiEndpointVO = {
      id: "ep-test",
      tag: "Test",
      tagKey: "test",
      method: "GET",
      path: "/api/v1/mock/ping",
      name: "Ping",
    };

    const result = await executeSandboxRequest({
      endpoint,
      params: {},
      body: "",
      token: "mock-token",
    });

    expect(result).toBeDefined();
    expect(result.loading).toBe(false);
    expect(result.curlCommand).toContain("curl -X GET");
    expect(result.curlCommand).toContain("mock-token");
    expect(result.requestedAt).toBeTruthy();
  });
});
