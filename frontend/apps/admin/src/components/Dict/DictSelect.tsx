import React from 'react';
import { Select, type SelectProps } from 'antd';
import { useDict } from '../../hooks/useDict';

export interface DictSelectProps extends Omit<SelectProps, 'options'> {
  /** 字典类型编码，例如 'sys_notice_type' */
  dictType: string;
  /** 传值类型：auto（自适应纯数字与字符串）、string（强制字符串）、number（强制数值） */
  valueType?: 'auto' | 'string' | 'number';
}

/**
 * 声明式字典下拉选择器组件 (DictSelect)
 *
 * 自动绑定字典数据项 options，支持纯数字与纯字符串智能转换与跨 Tab 热更新。
 */
export const DictSelect: React.FC<DictSelectProps> = ({
  dictType,
  valueType = 'auto',
  loading: customLoading,
  placeholder = '请选择',
  allowClear = true,
  ...restProps
}) => {
  const { options, stringOptions, numberOptions, loading: dictLoading } = useDict(dictType);

  const selectedOptions =
    valueType === 'number'
      ? numberOptions
      : valueType === 'string'
      ? stringOptions
      : options;

  return (
    <Select
      placeholder={placeholder}
      allowClear={allowClear}
      loading={customLoading || dictLoading}
      options={selectedOptions}
      {...restProps}
    />
  );
};

export default DictSelect;
