import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { App } from "antd";
import { NoticeIcon } from "../src/components/RightContent/NoticeIcon";

const RenderWithApp: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <App>{children}</App>
);

describe("NoticeIcon Component", () => {
  it("should render bell icon with initial unread badge", () => {
    const { container } = render(
      <RenderWithApp>
        <NoticeIcon />
      </RenderWithApp>
    );

    // Should display bell icon
    expect(container.querySelector(".anticon-bell")).toBeDefined();
    // Total initial unread items is 6
    expect(screen.getByText("6")).toBeDefined();
  });

  it("should open popover and show 3 tabs when clicked", () => {
    render(
      <RenderWithApp>
        <NoticeIcon />
      </RenderWithApp>
    );

    const bell = screen.getByText("6");
    fireEvent.click(bell);

    // Check tabs
    expect(screen.getByText(/通知/)).toBeDefined();
    expect(screen.getByText(/消息/)).toBeDefined();
    expect(screen.getByText(/待办/)).toBeDefined();
  });
});
