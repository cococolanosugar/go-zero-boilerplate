import React from 'react';
import { Badge } from 'antd';
import { useDict, type ProTableStatus } from '../../hooks/useDict';

export interface DictBadgeProps {
  /** 字典类型编码，例如 'sys_common_status' */
  dictType: string;
  /** 当前绑定的字典数据值 */
  value?: string | number | null;
  /** 未匹配到字典时的兜底展示文本 */
  defaultLabel?: string;
  /** 是否展示徽标右侧文本，默认为 true */
  showText?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

const STATUS_MAP: Record<string, 'success' | 'processing' | 'default' | 'error' | 'warning'> = {
  Success: 'success',
  Processing: 'processing',
  Default: 'default',
  Error: 'error',
  Warning: 'warning',
};

/**
 * 声明式字典徽标状态组件 (DictBadge)
 *
 * 自动根据字典定义与状态映射渲染 Ant Design Badge 状态圆点，
 * 支持响应式监听字典数据更新。
 */
export const DictBadge: React.FC<DictBadgeProps> = ({
  dictType,
  value,
  defaultLabel,
  showText = true,
  style,
  className,
}) => {
  const { valueEnum, getLabel } = useDict(dictType);

  if (value === undefined || value === null || value === '') {
    return <span style={{ color: '#bfbfbf', ...style }}>-</span>;
  }

  const enumItem = valueEnum[value];
  const label = enumItem?.text || getLabel(value) || defaultLabel || String(value);
  const statusStr = enumItem?.status ? STATUS_MAP[enumItem.status] : undefined;
  const badgeColor = enumItem?.color;

  return (
    <Badge
      status={badgeColor ? undefined : (statusStr || 'default')}
      color={badgeColor}
      text={showText ? label : undefined}
      style={style}
      className={className}
    />
  );
};

export default DictBadge;
