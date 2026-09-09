import React, { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "../src/components/ErrorBoundary";

const BuggyComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error("Test Crash Boom!");
  }
  return <div>Normal Component Content</div>;
};

const TestWrapper: React.FC = () => {
  const [hasError, setHasError] = useState(true);
  return (
    <ErrorBoundary onReset={() => setHasError(false)}>
      <BuggyComponent shouldThrow={hasError} />
    </ErrorBoundary>
  );
};

describe("ErrorBoundary Component", () => {
  it("should render children normally when no error occurs", () => {
    render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Normal Component Content")).toBeDefined();
  });

  it("should catch render error and display fallback Result card", () => {
    // Suppress console.error output during intentional error test
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("页面渲染发生异常")).toBeDefined();
    expect(screen.getByText(/Test Crash Boom!/)).toBeDefined();
    expect(screen.getByText("重试本页面")).toBeDefined();

    spy.mockRestore();
  });

  it("should support reset and remount normal content", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<TestWrapper />);
    expect(screen.getByText("页面渲染发生异常")).toBeDefined();

    // Click retry
    const retryBtn = screen.getByText("重试本页面");
    fireEvent.click(retryBtn);

    expect(screen.getByText("Normal Component Content")).toBeDefined();
    spy.mockRestore();
  });
});
