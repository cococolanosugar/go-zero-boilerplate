import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listOnlineSessions, forceLogoutOnlineSession, type OnlineSessionItem } from '@zero/api';
import { PERMISSIONS } from '@zero/shared';

describe('Online User Sessions & Force-Logout Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('PERMISSIONS contains online session permission codes', () => {
    expect(PERMISSIONS.ONLINE_QUERY).toBe('system:online:query');
    expect(PERMISSIONS.ONLINE_FORCE).toBe('system:online:force');
  });

  it('listOnlineSessions issues GET to /api/v1/system/online with query params', async () => {
    let capturedUrl = '';
    let capturedMethod = '';

    global.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      capturedUrl = url;
      capturedMethod = options.method;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          code: 200,
          msg: 'SUCCESS',
          data: {
            total: 2,
            list: [
              {
                sessionId: 'sess-001',
                userId: 1,
                username: 'admin',
                realName: 'SuperAdmin',
                deptName: '研发中心',
                loginIp: '127.0.0.1',
                loginLocation: '本机开发环境',
                browser: 'Chrome',
                os: 'Windows',
                loginTime: '2026-09-12 20:00:00',
                isCurrent: true,
              },
              {
                sessionId: 'sess-002',
                userId: 2,
                username: 'testuser',
                realName: '测试用户',
                deptName: '运营部',
                loginIp: '192.168.1.10',
                loginLocation: '企业内网局域网',
                browser: 'Firefox',
                os: 'macOS',
                loginTime: '2026-09-12 20:05:00',
                isCurrent: false,
              },
            ],
          },
        }),
      };
    });

    const res: any = await listOnlineSessions({
      page: 1,
      pageSize: 10,
      username: 'admin',
      loginIp: '127.0.0.1',
    });

    expect(capturedUrl).toContain('/api/v1/system/online');
    expect(capturedUrl).toContain('page=1');
    expect(capturedUrl).toContain('pageSize=10');
    expect(capturedUrl).toContain('username=admin');
    expect(capturedUrl).toContain('loginIp=127.0.0.1');
    expect(capturedMethod).toBe('GET');

    const total = res.total ?? res.data?.total;
    const list = res.list ?? res.data?.list;
    expect(total).toBe(2);
    expect(list).toHaveLength(2);
    expect(list[0].isCurrent).toBe(true);
    expect(list[1].isCurrent).toBe(false);
  });

  it('forceLogoutOnlineSession issues DELETE to /api/v1/system/online/:sessionId', async () => {
    let capturedUrl = '';
    let capturedMethod = '';

    global.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      capturedUrl = url;
      capturedMethod = options.method;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          code: 200,
          msg: 'SUCCESS',
          data: { success: true },
        }),
      };
    });

    const targetSessionId = 'sess-to-terminate-123';
    const res = await forceLogoutOnlineSession({}, targetSessionId);

    expect(capturedUrl).toContain(`/api/v1/system/online/${targetSessionId}`);
    expect(capturedMethod).toBe('DELETE');
    expect(res).toBeDefined();
  });

  it('identifies self-session vs non-self session correctly', () => {
    const sessions: OnlineSessionItem[] = [
      {
        sessionId: 's1',
        userId: 1,
        username: 'admin',
        realName: 'SuperAdmin',
        deptName: '研发中心',
        loginIp: '127.0.0.1',
        loginLocation: '本机开发环境',
        browser: 'Chrome',
        os: 'Windows',
        loginTime: '2026-09-12 20:00:00',
        isCurrent: true,
      },
      {
        sessionId: 's2',
        userId: 2,
        username: 'guest',
        realName: '访客',
        deptName: '',
        loginIp: '10.0.0.5',
        loginLocation: '企业内网局域网',
        browser: 'Safari',
        os: 'iOS',
        loginTime: '2026-09-12 20:10:00',
        isCurrent: false,
      },
    ];

    const currentSession = sessions.find((s) => s.isCurrent);
    const forceableSessions = sessions.filter((s) => !s.isCurrent);

    expect(currentSession?.sessionId).toBe('s1');
    expect(forceableSessions).toHaveLength(1);
    expect(forceableSessions[0].sessionId).toBe('s2');
  });
});
