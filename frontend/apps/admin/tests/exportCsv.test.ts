import { describe, it, expect, vi } from "vitest";
import { exportToCsv } from "../src/utils/exportCsv";

describe("exportToCsv", () => {
  it("returns false for empty data", () => {
    expect(exportToCsv([], [{ title: "ID", dataIndex: "id" }])).toBe(false);
  });

  it("triggers CSV download for valid dataset", () => {
    const createObjectURLMock = vi.fn().mockReturnValue("blob:mock-url");
    const revokeObjectURLMock = vi.fn();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    const data = [
      { id: 101, name: "微服务订单 A", amount: 9900 },
      { id: 102, name: "微服务订单 B", amount: 15000 },
    ];

    const columns = [
      { title: "ID", dataIndex: "id" },
      { title: "名称", dataIndex: "name" },
      { title: "金额", dataIndex: "amount" },
    ];

    const res = exportToCsv(data, columns, "test.csv");
    expect(res).toBe(true);
    expect(createObjectURLMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();
  });
});
