// Titan 表单校验规则集中定义
export const TITAN_NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/; // slug：小写字母/数字/中划线
export const TITAN_NAME_MAX_LEN = 63; // 与 K8s DNS-1123 对齐

// JSON 字段校验器：非法时 reject
export const jsonValidator = async (_rule: unknown, value: string) => {
  if (!value) return; // 空值由 required 规则管理
  try {
    JSON.parse(value);
  } catch {
    throw new Error("不是合法的 JSON 格式");
  }
};

// K8s DNS-1123 校验器（命名空间/应用标识）
export const dns1123Validator = async (_rule: unknown, value: string) => {
  if (!value) return;
  if (value.length > TITAN_NAME_MAX_LEN) throw new Error("长度不能超过 63 字符");
  if (!TITAN_NAME_PATTERN.test(value)) throw new Error("仅允许小写字母、数字与中划线，且以字母或数字开头结尾");
};

// URL 校验器
export const urlValidator = async (_rule: unknown, value: string) => {
  if (!value) return;
  try {
    new URL(value);
  } catch {
    throw new Error("请输入合法的 URL（含协议头，如 https://…）");
  }
};
