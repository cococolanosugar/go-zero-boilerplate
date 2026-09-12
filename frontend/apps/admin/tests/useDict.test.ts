import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDict, buildDictBundle, clearDictCache } from '../src/hooks/useDict';
import * as api from '@zero/api';

describe('useDict Hook and DictBundle', () => {
  beforeEach(() => {
    clearDictCache();
    vi.restoreAllMocks();
  });

  it('buildDictBundle properly constructs options, valueEnum, and label helpers', () => {
    const rawItems = [
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
        listClass: 'error',
      },
      {
        id: 3,
        dictType: 'sys_common_status',
        dictLabel: '警告中',
        dictValue: '2',
        listClass: 'warning',
      },
      {
        id: 4,
        dictType: 'sys_common_status',
        dictLabel: '处理中',
        dictValue: '3',
        listClass: 'processing',
      },
      {
        id: 5,
        dictType: 'sys_common_status',
        dictLabel: '自定义色',
        dictValue: 'custom',
        listClass: '#722ed1',
      },
    ] as any[];

    const bundle = buildDictBundle(rawItems);

    // 1. Options assertions
    expect(bundle.options).toHaveLength(5);
    expect(bundle.options[0].label).toBe('正常');
    expect(bundle.options[0].value).toBe(1); // numeric conversion
    expect(bundle.options[0].stringValue).toBe('1');
    expect(bundle.options[4].value).toBe('custom'); // string preserved

    // 2. ValueEnum assertions for ProTable
    expect(bundle.valueEnum['1'].text).toBe('正常');
    expect(bundle.valueEnum['1'].status).toBe('Success');
    expect(bundle.valueEnum[1].status).toBe('Success'); // numeric key indexable
    expect(bundle.valueEnum['0'].status).toBe('Error');
    expect(bundle.valueEnum['2'].status).toBe('Warning');
    expect(bundle.valueEnum['3'].status).toBe('Processing');
    expect(bundle.valueEnum['custom'].color).toBe('#722ed1');

    // 3. Label & Color Helpers
    expect(bundle.getLabel(1)).toBe('正常');
    expect(bundle.getLabel('1')).toBe('正常');
    expect(bundle.getLabel(0)).toBe('停用');
    expect(bundle.getLabel('unknown')).toBe('unknown');
    expect(bundle.getTagColor(1)).toBe('green');
    expect(bundle.getTagColor('custom')).toBe('#722ed1');
  });

  it('useDict loads single dict and flattens properties on root return', async () => {
    const mockList = [
      { id: 10, dictType: 'test_type', dictLabel: '选项A', dictValue: 'A', listClass: 'primary' },
      { id: 11, dictType: 'test_type', dictLabel: '选项B', dictValue: 'B', listClass: 'default' },
    ];

    const getSpy = vi.spyOn(api, 'getDictDataByType').mockResolvedValue({
      list: mockList as any,
    } as any);

    const { result } = renderHook(() => useDict('test_type'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(result.current.options).toHaveLength(2);
    expect(result.current.valueEnum['A'].text).toBe('选项A');
    expect(result.current.getLabel('A')).toBe('选项A');
  });

  it('useDict loads multiple dicts concurrently and caches results', async () => {
    const getSpy = vi.spyOn(api, 'getDictDataByType').mockImplementation(async (_params: any, dictType: string) => {
      if (dictType === 'type_1') {
        return { list: [{ dictLabel: '1号', dictValue: '1' }] } as any;
      }
      return { list: [{ dictLabel: '2号', dictValue: '2' }] } as any;
    });

    const { result } = renderHook(() => useDict('type_1', 'type_2'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(getSpy).toHaveBeenCalledTimes(2);
    expect(result.current.type_1.options[0].label).toBe('1号');
    expect(result.current.type_2.options[0].label).toBe('2号');

    // Subsequent hook render hits in-memory cache without extra API calls
    const { result: secondResult } = renderHook(() => useDict('type_1'));
    expect(secondResult.current.options[0].label).toBe('1号');
    expect(getSpy).toHaveBeenCalledTimes(2); // Still 2!
  });
});
