import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updatePersonalProfile, changePersonalPassword } from '@zero/api';

describe('Account Settings & Security API test suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('updatePersonalProfile successfully issues PUT to /api/v1/system/personal/profile', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody: any = null;

    global.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      capturedUrl = url;
      capturedMethod = options.method;
      capturedBody = JSON.parse(options.body);
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

    const payload = {
      realName: 'Super Developer',
      mobile: '13812345678',
      email: 'dev@example.com',
      avatar: '/uploads/2026/09/12/avatar.png',
    };

    const res = await updatePersonalProfile(payload);

    expect(capturedUrl).toContain('/api/v1/system/personal/profile');
    expect(capturedMethod).toBe('PUT');
    expect(capturedBody).toEqual(payload);
    expect(res.success).toBe(true);
  });

  it('changePersonalPassword successfully issues PUT to /api/v1/system/personal/password', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody: any = null;

    global.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      capturedUrl = url;
      capturedMethod = options.method;
      capturedBody = JSON.parse(options.body);
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

    const payload = {
      oldPassword: 'currentPassword123',
      newPassword: 'newStrongPassword456',
    };

    const res = await changePersonalPassword(payload);

    expect(capturedUrl).toContain('/api/v1/system/personal/password');
    expect(capturedMethod).toBe('PUT');
    expect(capturedBody).toEqual(payload);
    expect(res.success).toBe(true);
  });

  it('validates password matching logic for security settings', () => {
    const validateConfirmPassword = (newPassword: string, confirmPassword: string) => {
      if (!confirmPassword) return '请输入确认密码';
      if (newPassword !== confirmPassword) return '两次输入的密码不一致！';
      return null;
    };

    expect(validateConfirmPassword('123456', '123456')).toBeNull();
    expect(validateConfirmPassword('123456', '654321')).toBe('两次输入的密码不一致！');
    expect(validateConfirmPassword('123456', '')).toBe('请输入确认密码');
  });

  it('handles server error response when old password is wrong', async () => {
    global.fetch = vi.fn().mockImplementation(async () => {
      return {
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          code: 100001,
          msg: '原密码错误，请重新输入',
        }),
      };
    });

    await expect(
      changePersonalPassword({
        oldPassword: 'wrong_password',
        newPassword: 'new_password',
      })
    ).rejects.toThrow();
  });
});
