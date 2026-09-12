import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { request, clearPendingRequests, ApiError } from '@zero/api';

describe('Frontend Anti-Repeat Submission & Idempotency', () => {
  beforeEach(() => {
    clearPendingRequests();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    clearPendingRequests();
  });

  it('blocks duplicate POST request with identical url and body within duplicateInterval', async () => {
    let fetchCalls = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      fetchCalls++;
      return new Response(JSON.stringify({ code: 200, msg: 'SUCCESS', data: { id: 1 } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    // First POST request succeeds
    const res1 = await request({
      method: 'POST',
      url: '/api/v1/system/notice',
      data: { title: 'Test Notice', content: 'Testing duplicate' },
      config: { duplicateInterval: 3000 },
    });
    expect(res1).toEqual({ id: 1 });
    expect(fetchCalls).toBe(1);

    // Second immediate POST request with identical payload is blocked by client guard
    await expect(
      request({
        method: 'POST',
        url: '/api/v1/system/notice',
        data: { title: 'Test Notice', content: 'Testing duplicate' },
        config: { duplicateInterval: 3000 },
      })
    ).rejects.toThrowError('请求正在处理中或请勿频繁重复提交，请稍后再试');

    // fetch was NOT called a second time
    expect(fetchCalls).toBe(1);
  });

  it('allows second request if preventDuplicate is explicitly false', async () => {
    let fetchCalls = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      fetchCalls++;
      return new Response(JSON.stringify({ code: 200, msg: 'SUCCESS', data: { count: fetchCalls } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    await request({
      method: 'POST',
      url: '/api/v1/orders',
      data: { amount: 100 },
      config: { preventDuplicate: false },
    });

    await request({
      method: 'POST',
      url: '/api/v1/orders',
      data: { amount: 100 },
      config: { preventDuplicate: false },
    });

    expect(fetchCalls).toBe(2);
  });

  it('attaches X-Idempotency-Key and X-Repeat-Submit-Interval headers', async () => {
    let capturedHeaders: any = null;
    const mockFetch = vi.fn().mockImplementation(async (_url: string, options: any) => {
      capturedHeaders = options.headers;
      return new Response(JSON.stringify({ code: 200, msg: 'SUCCESS', data: { ok: true } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    await request({
      method: 'PUT',
      url: '/api/v1/system/users/1',
      data: { status: '1' },
      config: {
        idempotencyKey: 'idemp-uuid-888',
        duplicateInterval: 5000,
      },
    });

    expect(capturedHeaders['X-Idempotency-Key']).toBe('idemp-uuid-888');
    expect(capturedHeaders['X-Repeat-Submit-Interval']).toBe('5');
  });

  it('does NOT block safe GET requests with identical params', async () => {
    let fetchCalls = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      fetchCalls++;
      return new Response(JSON.stringify({ code: 200, msg: 'SUCCESS', data: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    await request({
      method: 'GET',
      url: '/api/v1/system/notice',
    });

    await request({
      method: 'GET',
      url: '/api/v1/system/notice',
    });

    expect(fetchCalls).toBe(2);
  });

  it('allows subsequent request after clearPendingRequests', async () => {
    let fetchCalls = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      fetchCalls++;
      return new Response(JSON.stringify({ code: 200, msg: 'SUCCESS', data: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    await request({
      method: 'POST',
      url: '/api/v1/system/roles',
      data: { roleName: 'Admin' },
    });

    clearPendingRequests();

    await request({
      method: 'POST',
      url: '/api/v1/system/roles',
      data: { roleName: 'Admin' },
    });

    expect(fetchCalls).toBe(2);
  });
});
