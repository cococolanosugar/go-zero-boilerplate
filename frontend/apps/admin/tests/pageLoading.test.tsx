import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageLoading } from "@ant-design/pro-components";

describe("PageLoading Guard", () => {
  it("renders PageLoading component cleanly without errors", () => {
    const { container } = render(<PageLoading />);
    expect(container).toBeDefined();
    expect(container.querySelector(".ant-pro-page-loading") || container.firstChild).toBeTruthy();
  });
});
