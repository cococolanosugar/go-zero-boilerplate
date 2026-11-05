import { describe, it, expect } from "vitest";
import {
  MICROSERVICES_CATALOG,
  INFRA_CATALOG,
  TOPOLOGY_EDGES,
} from "../src/pages/Services/components/catalogData";
import {
  probeGatewayHealth,
  probeAllServicesHealth,
} from "../src/pages/Services/components/probes";

describe("Service Catalog Data Integrity Tests", () => {
  it("should have comprehensive microservices catalog entries", () => {
    expect(MICROSERVICES_CATALOG.length).toBe(5);

    const serviceCodes = MICROSERVICES_CATALOG.map((s) => s.code);
    expect(serviceCodes).toContain("gateway");
    expect(serviceCodes).toContain("user.rpc");
    expect(serviceCodes).toContain("worker.rpc");
    expect(serviceCodes).toContain("itsm.rpc");
    expect(serviceCodes).toContain("titan.rpc");

    // Verify port and protocol specifications
    const portMap = Object.fromEntries(MICROSERVICES_CATALOG.map((s) => [s.code, s.port]));
    expect(portMap["gateway"]).toBe(8888);
    expect(portMap["user.rpc"]).toBe(8080);
    expect(portMap["worker.rpc"]).toBe(8082);
    expect(portMap["itsm.rpc"]).toBe(8084);
    expect(portMap["titan.rpc"]).toBe(8086);

    // Verify fields
    MICROSERVICES_CATALOG.forEach((s) => {
      expect(s.id).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.owner).toBeTruthy();
      expect(s.domain).toBeTruthy();
      expect(s.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(s.tags.length).toBeGreaterThan(0);
      expect(s.upstreamIds).toBeDefined();
      expect(s.downstreamIds).toBeDefined();
    });
  });

  it("should have comprehensive infrastructure catalog entries", () => {
    expect(INFRA_CATALOG.length).toBe(4);

    const infraIds = INFRA_CATALOG.map((i) => i.id);
    expect(infraIds).toContain("mysql");
    expect(infraIds).toContain("redis");
    expect(infraIds).toContain("temporal");
    expect(infraIds).toContain("nacos");

    INFRA_CATALOG.forEach((i) => {
      expect(i.name).toBeTruthy();
      expect(i.role).toBeTruthy();
      expect(i.port).toBeTruthy();
      expect(i.protocol).toBeTruthy();
      expect(i.tags.length).toBeGreaterThan(0);
    });
  });

  it("should have valid topology dependency edges", () => {
    expect(TOPOLOGY_EDGES.length).toBeGreaterThanOrEqual(10);

    const validNodeIds = new Set([
      "portal-client",
      "admin-client",
      ...MICROSERVICES_CATALOG.map((s) => s.id),
      ...INFRA_CATALOG.map((i) => i.id),
    ]);

    TOPOLOGY_EDGES.forEach((edge) => {
      expect(validNodeIds.has(edge.source)).toBe(true);
      expect(validNodeIds.has(edge.target)).toBe(true);
      expect(edge.protocol).toBeTruthy();
      expect(edge.label).toBeTruthy();
    });
  });
});

describe("Service Probing Engine Tests", () => {
  it("should probe gateway health without crashing", async () => {
    const health = await probeGatewayHealth("localhost");
    expect(health).toBeDefined();
    expect(health.serviceId).toBe("gateway");
    expect(["healthy", "unhealthy", "unknown"]).toContain(health.status);
    expect(health.checkedAt).toBeTruthy();
  });

  it("should probe all services health map", async () => {
    const ids = ["gateway", "user-rpc", "worker-rpc", "itsm-rpc", "titan-rpc"];
    const healthMap = await probeAllServicesHealth(ids, "localhost");

    expect(healthMap).toBeDefined();
    ids.forEach((id) => {
      expect(healthMap[id]).toBeDefined();
      expect(healthMap[id].serviceId).toBe(id);
      expect(["healthy", "unhealthy", "unknown"]).toContain(healthMap[id].status);
    });
  });
});
