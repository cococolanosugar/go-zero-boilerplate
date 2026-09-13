import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { CommandPalette } from "../src/components/CommandPalette";

describe("CommandPalette", () => {
  it("renders when open is true", () => {
    render(
      <BrowserRouter>
        <CommandPalette open={true} />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/输入页面名称/)).toBeDefined();
    expect(screen.getByText(/工作台/)).toBeDefined();
    expect(screen.getByText(/监控大盘/)).toBeDefined();
  });

  it("filters items based on user input", () => {
    render(
      <BrowserRouter>
        <CommandPalette open={true} />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(/输入页面名称/);
    fireEvent.change(input, { target: { value: "工作台" } });

    expect(screen.getByText(/工作台/)).toBeDefined();
    expect(screen.queryByText(/员工管理/)).toBeNull();
  });

  it("dynamically discovers system dictionary and api routes from route configuration", () => {
    render(
      <BrowserRouter>
        <CommandPalette open={true} />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(/输入页面名称/);
    fireEvent.change(input, { target: { value: "数据字典" } });

    expect(screen.getByText(/数据字典/)).toBeDefined();
    expect(screen.queryByText(/工作台/)).toBeNull();
  });
});
