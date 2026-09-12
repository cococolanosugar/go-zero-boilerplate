import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadSingleFile } from '@zero/api';

describe('Universal Storage Upload API helper', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('wraps File into FormData with "file" key and posts to upload endpoint', async () => {
    let capturedBody: any = null;
    let capturedUrl: string = '';

    // Mock global fetch
    global.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      capturedUrl = url;
      capturedBody = options.body;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          code: 200,
          msg: 'SUCCESS',
          data: {
            url: '/uploads/2026/09/12/fake-hash.png',
            filename: 'fake-hash.png',
            originalName: 'test.png',
            size: 100,
            mimeType: 'image/png',
            hash: 'fake-hash',
          },
        }),
      };
    });

    const file = new File(['fake-content'], 'test.png', { type: 'image/png' });
    const res = await uploadSingleFile(file);

    expect(capturedUrl).toContain('/api/v1/system/file/upload');
    expect(capturedBody).toBeInstanceOf(FormData);
    expect(capturedBody.get('file')).toBeDefined();
    expect(res.url).toBe('/uploads/2026/09/12/fake-hash.png');
    expect(res.hash).toBe('fake-hash');
  });

  it('preserves custom FormData if passed directly', async () => {
    let capturedBody: any = null;

    global.fetch = vi.fn().mockImplementation(async (_url: string, options: any) => {
      capturedBody = options.body;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          code: 200,
          msg: 'SUCCESS',
          data: { url: '/uploads/custom.pdf' },
        }),
      };
    });

    const customFormData = new FormData();
    customFormData.append('file', new Blob(['pdf-bytes']), 'document.pdf');
    customFormData.append('bizType', 'contract');

    const res = await uploadSingleFile(customFormData);

    expect(capturedBody).toBe(customFormData);
    expect(capturedBody.get('bizType')).toBe('contract');
    expect(res.url).toBe('/uploads/custom.pdf');
  });
});
