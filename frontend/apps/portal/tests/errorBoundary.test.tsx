import React, { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "../src/components/ErrorBoundary";

const BuggyComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error("Portal Crash Boom!");
  }
  return <div>Normal Portal Component Content</div>;
};

const TestWrapper: React.FC = () => {
  const [hasError, setHasError] = useState(true);
  return (
    <ErrorBoundary onReset={() => setHasError(false)}>
      <BuggyComponent shouldThrow={hasError} />
    </ErrorBoundary>
  );
};

describe("Portal ErrorBoundary Component", () => {
  it("should render children normally when no error occurs", () => {
    render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Normal Portal Component Content")).toBeDefined();
  });

  it("should catch render error and display fallback Result card", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("页面渲染发生异常")).toBeDefined();
    expect(screen.getByText(/Portal Crash Boom!/)).toBeDefined();
    expect(screen.getByText("重试本页面")).toBeDefined();

    spy.mockRestore();
  });

  it("should support reset and remount normal content", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<TestWrapper />);
    expect(screen.getByText("页面渲染发生异常")).toBeDefined();

    const retryBtn = screen.getByText("重试本页面");
    fireEvent.click(retryBtn);

    expect(screen.getByText("Normal Portal Component Content")).toBeDefined();
    spy.mockRestore();
  });
});
