import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "antd";
import { Access } from "../src/components/Access";
import { InitialStateProvider } from "../src/contexts/InitialStateContext";
import { useAccess } from "../src/hooks/useAccess";

describe("Declarative <Access> & useAccess Test Suite", () => {
  const createMockInitialState = (overrides?: any) => {
    return async () => ({
      currentUser: {
        id: 2,
        username: "developer",
        realName: "Dev User",
        roles: ["ROLE_DEV"],
        permissions: ["system:user:query", "system:user:add"],
        ...overrides?.currentUser,
      },
      permissions: overrides?.permissions ?? ["system:user:query", "system:user:add"],
      roles: overrides?.roles ?? ["ROLE_DEV"],
      isSuperAdmin: overrides?.isSuperAdmin ?? false,
      loading: false,
    });
  };

  const TestConsumer: React.FC = () => {
    const access = useAccess();
    return (
      <div>
        <div data-testid="can-admin">{String(access.canAdmin)}</div>
        <div data-testid="has-add">{String(access.hasPermission("system:user:add"))}</div>
        <div data-testid="has-delete">{String(access.hasPermission("system:user:delete"))}</div>
        <div data-testid="has-role-dev">{String(access.hasRole("ROLE_DEV"))}</div>
        <div data-testid="has-role-admin">{String(access.hasRole("ROLE_ADMIN"))}</div>
      </div>
    );
  };

  it("useAccess extracts permissions and roles correctly for common user", async () => {
    const getInitialState = createMockInitialState();
    render(
      <InitialStateProvider getInitialState={getInitialState}>
        <TestConsumer />
      </InitialStateProvider>
    );

    expect(await screen.findByTestId("can-admin")).toHaveTextContent("false");
    expect(screen.getByTestId("has-add")).toHaveTextContent("true");
    expect(screen.getByTestId("has-delete")).toHaveTextContent("false");
    expect(screen.getByTestId("has-role-dev")).toHaveTextContent("true");
    expect(screen.getByTestId("has-role-admin")).toHaveTextContent("false");
  });

  it("useAccess grants all permissions when user is super admin", async () => {
    const getInitialState = createMockInitialState({
      currentUser: { id: 1, roles: ["ROLE_ADMIN"] },
      isSuperAdmin: true,
      permissions: [],
    });

    render(
      <InitialStateProvider getInitialState={getInitialState}>
        <TestConsumer />
      </InitialStateProvider>
    );

    expect(await screen.findByTestId("can-admin")).toHaveTextContent("true");
    expect(screen.getByTestId("has-add")).toHaveTextContent("true");
    expect(screen.getByTestId("has-delete")).toHaveTextContent("true");
    expect(screen.getByTestId("has-role-admin")).toHaveTextContent("true");
  });

  it("<Access> renders children when accessible is true", async () => {
    const getInitialState = createMockInitialState();
    render(
      <InitialStateProvider getInitialState={getInitialState}>
        <Access accessible={true}>
          <Button data-testid="btn-visible">Visible Button</Button>
        </Access>
      </InitialStateProvider>
    );

    expect(await screen.findByTestId("btn-visible")).toBeInTheDocument();
  });

  it("<Access> hides children when accessible is false", async () => {
    const getInitialState = createMockInitialState();
    render(
      <InitialStateProvider getInitialState={getInitialState}>
        <Access accessible={false}>
          <Button data-testid="btn-hidden">Hidden Button</Button>
        </Access>
      </InitialStateProvider>
    );

    // Wait for provider to mount
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByTestId("btn-hidden")).toBeNull();
  });

  it("<Access> renders fallback when accessible is false and fallback is provided", async () => {
    const getInitialState = createMockInitialState();
    render(
      <InitialStateProvider getInitialState={getInitialState}>
        <Access accessible={false} fallback={<span data-testid="fallback-node">无权限查看</span>}>
          <Button data-testid="btn-hidden">Hidden Button</Button>
        </Access>
      </InitialStateProvider>
    );

    expect(await screen.findByTestId("fallback-node")).toHaveTextContent("无权限查看");
    expect(screen.queryByTestId("btn-hidden")).toBeNull();
  });

  it("<Access> renders disabled child with Tooltip when fallbackMode is disabled", async () => {
    const getInitialState = createMockInitialState();
    render(
      <InitialStateProvider getInitialState={getInitialState}>
        <Access accessible={false} fallbackMode="disabled" fallbackTooltip="暂无删除权限">
          <Button data-testid="btn-disabled">Delete Button</Button>
        </Access>
      </InitialStateProvider>
    );

    const btn = await screen.findByTestId("btn-disabled");
    expect(btn).toBeDisabled();
  });

  it("<Access> evaluates permission strings correctly", async () => {
    const getInitialState = createMockInitialState();
    render(
      <InitialStateProvider getInitialState={getInitialState}>
        <Access permission="system:user:add">
          <Button data-testid="btn-add">Add User</Button>
        </Access>
        <Access permission="system:user:delete">
          <Button data-testid="btn-delete">Delete User</Button>
        </Access>
      </InitialStateProvider>
    );

    expect(await screen.findByTestId("btn-add")).toBeInTheDocument();
    expect(screen.queryByTestId("btn-delete")).toBeNull();
  });

  it("<Access> supports mode=all vs mode=one", async () => {
    const getInitialState = createMockInitialState({
      permissions: ["p1"],
    });

    render(
      <InitialStateProvider getInitialState={getInitialState}>
        <Access permission={["p1", "p2"]} mode="one">
          <span data-testid="one-match">One Match</span>
        </Access>
        <Access permission={["p1", "p2"]} mode="all">
          <span data-testid="all-match">All Match</span>
        </Access>
      </InitialStateProvider>
    );

    expect(await screen.findByTestId("one-match")).toBeInTheDocument();
    expect(screen.queryByTestId("all-match")).toBeNull();
  });
});
