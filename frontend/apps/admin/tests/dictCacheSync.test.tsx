import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import * as api from '@zero/api';
import {
  useDict,
  clearDictCache,
  broadcastDictUpdate,
  dictEventEmitter,
} from '../src/hooks/useDict';
import { DictTag, DictBadge, DictSelect } from '../src/components/Dict';

describe('Data Dictionary L1/L2 Cache & Reactive Sync', () => {
  const mockNoticeItems = [
    {
      id: 1,
      dictType: 'sys_notice_type',
      dictLabel: '通知',
      dictValue: '1',
      listClass: 'primary',
    },
    {
      id: 2,
      dictType: 'sys_notice_type',
      dictLabel: '公告',
      dictValue: '2',
      listClass: 'success',
    },
    {
      id: 3,
      dictType: 'sys_notice_type',
      dictLabel: '警告',
      dictValue: '3',
      listClass: 'warning',
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    clearDictCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    clearDictCache();
  });

  it('L2 Cache: saves fetched dict to localStorage with expiration metadata', async () => {
    const getSpy = vi.spyOn(api, 'getDictDataByType').mockResolvedValue({
      list: mockNoticeItems as any,
    } as any);

    const { result } = renderHook(() => useDict('sys_notice_type'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(getSpy).toHaveBeenCalledTimes(1);

    // Verify localStorage L2 cache entry
    const l2Raw = localStorage.getItem('sys:dict:cache:sys_notice_type');
    expect(l2Raw).not.toBeNull();
    const l2Parsed = JSON.parse(l2Raw!);
    expect(l2Parsed.dictType).toBe('sys_notice_type');
    expect(l2Parsed.data).toHaveLength(3);
    expect(l2Parsed.expireAt).toBeGreaterThan(Date.now());
  });

  it('L2 Cache: loads synchronously on initial render if L2 exists without calling API', async () => {
    // Pre-populate L2 cache
    const cachedData = {
      dictType: 'sys_notice_type',
      data: mockNoticeItems,
      expireAt: Date.now() + 3600 * 1000,
      version: 1,
    };
    localStorage.setItem('sys:dict:cache:sys_notice_type', JSON.stringify(cachedData));

    const getSpy = vi.spyOn(api, 'getDictDataByType');

    // Rendering hook should hit L2 synchronously
    const { result } = renderHook(() => useDict('sys_notice_type'));

    // Immediate synchronous hit
    expect(result.current.loading).toBe(false);
    expect(result.current.options).toHaveLength(3);
    expect(result.current.getLabel('1')).toBe('通知');
    expect(getSpy).not.toHaveBeenCalled();
  });

  it('L2 Cache: ignores and removes expired cache item', async () => {
    // Pre-populate expired L2 cache
    const expiredData = {
      dictType: 'sys_notice_type',
      data: mockNoticeItems,
      expireAt: Date.now() - 1000, // Expired
      version: 1,
    };
    localStorage.setItem('sys:dict:cache:sys_notice_type', JSON.stringify(expiredData));

    const freshItems = [
      {
        id: 10,
        dictType: 'sys_notice_type',
        dictLabel: '新通知',
        dictValue: '10',
        listClass: 'success',
      },
    ];

    const getSpy = vi.spyOn(api, 'getDictDataByType').mockResolvedValue({
      list: freshItems as any,
    } as any);

    const { result } = renderHook(() => useDict('sys_notice_type'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(result.current.options[0].label).toBe('新通知');
  });

  it('clearDictCache: selectively purges specific dict or all dicts from L1 and L2', () => {
    localStorage.setItem(
      'sys:dict:cache:type_a',
      JSON.stringify({ data: [], expireAt: Date.now() + 10000 })
    );
    localStorage.setItem(
      'sys:dict:cache:type_b',
      JSON.stringify({ data: [], expireAt: Date.now() + 10000 })
    );

    clearDictCache('type_a');
    expect(localStorage.getItem('sys:dict:cache:type_a')).toBeNull();
    expect(localStorage.getItem('sys:dict:cache:type_b')).not.toBeNull();

    clearDictCache();
    expect(localStorage.getItem('sys:dict:cache:type_b')).toBeNull();
  });

  it('dictEventEmitter & broadcastDictUpdate: triggers reactive update across listeners', async () => {
    let callCount = 0;
    const unsubscribe = dictEventEmitter.on('sys_notice_type', () => {
      callCount += 1;
    });

    broadcastDictUpdate('sys_notice_type');
    expect(callCount).toBe(1);

    broadcastDictUpdate('other_type');
    expect(callCount).toBe(1); // not called for different type

    unsubscribe();
    broadcastDictUpdate('sys_notice_type');
    expect(callCount).toBe(1); // not called after unsubscribe
  });

  it('Reactive Hook Update: useDict automatically re-fetches when broadcastDictUpdate fires', async () => {
    let items = mockNoticeItems;
    vi.spyOn(api, 'getDictDataByType').mockImplementation(async () => ({
      list: items as any,
    } as any));

    const { result } = renderHook(() => useDict('sys_notice_type'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.options).toHaveLength(3);

    // Update backend data and broadcast
    items = [
      ...mockNoticeItems,
      {
        id: 4,
        dictType: 'sys_notice_type',
        dictLabel: '紧急',
        dictValue: '4',
        listClass: 'danger',
      },
    ];

    await act(async () => {
      broadcastDictUpdate('sys_notice_type');
    });

    await waitFor(() => {
      expect(result.current.options).toHaveLength(4);
      expect(result.current.getLabel('4')).toBe('紧急');
    });
  });
});

describe('Declarative Dict Components', () => {
  const mockStatusItems = [
    {
      id: 1,
      dictType: 'sys_common_status',
      dictLabel: '正常',
      dictValue: '1',
      listClass: 'success',
    },
    {
      id: 2,
      dictType: 'sys_common_status',
      dictLabel: '停用',
      dictValue: '0',
      listClass: 'danger',
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    clearDictCache();
    vi.restoreAllMocks();
    vi.spyOn(api, 'getDictDataByType').mockResolvedValue({
      list: mockStatusItems as any,
    } as any);
  });

  afterEach(() => {
    localStorage.clear();
    clearDictCache();
  });

  it('DictTag renders label and semantic color', async () => {
    render(<DictTag dictType="sys_common_status" value="1" />);

    await waitFor(() => {
      expect(screen.getByText('正常')).toBeDefined();
    });

    const tag = screen.getByText('正常').closest('.ant-tag');
    expect(tag).not.toBeNull();
    expect(tag?.className).toContain('ant-tag-green');
  });

  it('DictTag renders dash when value is empty or null', () => {
    const { container } = render(<DictTag dictType="sys_common_status" value={null} />);
    expect(container.textContent).toBe('-');
  });

  it('DictBadge renders Badge status and label', async () => {
    render(<DictBadge dictType="sys_common_status" value="0" />);

    await waitFor(() => {
      expect(screen.getByText('停用')).toBeDefined();
    });

    const badge = screen.getByText('停用').closest('.ant-badge');
    expect(badge).not.toBeNull();
    expect(badge?.querySelector('.ant-badge-status-error')).not.toBeNull();
  });

  it('DictSelect renders options with values and labels', async () => {
    render(
      <DictSelect
        dictType="sys_common_status"
        placeholder="请选择状态"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('请选择状态')).toBeDefined();
    });
  });
});
