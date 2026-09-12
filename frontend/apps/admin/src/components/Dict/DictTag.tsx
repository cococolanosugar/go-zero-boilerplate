import React from 'react';
import { Tag } from 'antd';
import { useDict } from '../../hooks/useDict';

export interface DictTagProps {
  /** 字典类型编码，例如 'sys_notice_type' */
  dictType: string;
  /** 当前绑定的字典数据值 */
  value?: string | number | null;
  /** 未匹配到字典时的兜底展示文本，默认为 '-' 或原始值 */
  defaultLabel?: string;
  /** 变体样式：'outlined' | 'filled' | 'borderless' */
  variant?: 'outlined' | 'filled' | 'borderless';
  /** 样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
  /** 当 value 为空时是否显示破折号 '-'，默认为 true */
  showEmptyAsDash?: boolean;
}

/**
 * 声明式字典标签组件 (DictTag)
 *
 * 自动根据字典定义及 listClass 渲染具有语义化色彩的 Ant Design Tag，
 * 并响应式监听字典数据更新，支持跨 Tab 实时热更新。
 */
export const DictTag: React.FC<DictTagProps> = ({
  dictType,
  value,
  defaultLabel,
  variant,
  style,
  className,
  showEmptyAsDash = true,
}) => {
  const { getLabel, getTagColor, loading } = useDict(dictType);

  if (value === undefined || value === null || value === '') {
    if (showEmptyAsDash) {
      return <span style={{ color: '#bfbfbf', ...style }}>-</span>;
    }
    return null;
  }

  const label = getLabel(value) || defaultLabel || String(value);
  const color = getTagColor(value);

  return (
    <Tag
      color={color}
      variant={variant}
      style={{ fontWeight: 500, ...style }}
      className={className}
    >
      {label}
    </Tag>
  );
};

export default DictTag;
