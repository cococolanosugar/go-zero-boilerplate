/**
 * Sensitive data masking options
 */
export interface MaskOptions {
  head?: number;
  tail?: number;
  maskChar?: string;
}

/**
 * 手机号脱敏
 * 默认保留前 3 后 4，中间用 * 遮蔽 (e.g. 138****5678)
 */
export function maskPhone(phone?: string | null, options?: MaskOptions): string {
  if (!phone) return "";
  const str = String(phone).trim();
  const head = options?.head ?? 3;
  const tail = options?.tail ?? 4;
  const maskChar = options?.maskChar ?? "*";

  if (str.length <= head + tail) {
    return str;
  }

  const maskLen = str.length - head - tail;
  return `${str.slice(0, head)}${maskChar.repeat(maskLen)}${str.slice(-tail)}`;
}

/**
 * 邮箱脱敏
 * 默认保留首字符与域名，用户名中间字符用 * 遮蔽 (e.g. a***e@example.com 或 a***@example.com)
 */
export function maskEmail(email?: string | null, options?: { maskChar?: string }): string {
  if (!email) return "";
  const str = String(email).trim();
  const atIndex = str.indexOf("@");
  if (atIndex <= 0) return str;

  const local = str.slice(0, atIndex);
  const domain = str.slice(atIndex);
  const maskChar = options?.maskChar ?? "*";

  if (local.length <= 2) {
    return `${local[0]}${maskChar.repeat(3)}${domain}`;
  }

  const firstChar = local[0];
  const lastChar = local[local.length - 1];
  const maskLen = Math.max(3, local.length - 2);
  return `${firstChar}${maskChar.repeat(maskLen)}${lastChar}${domain}`;
}

/**
 * 身份证号脱敏
 * 默认保留前 6 后 4，中间用 * 遮蔽 (e.g. 110101********2345)
 */
export function maskIdCard(idCard?: string | null, options?: MaskOptions): string {
  if (!idCard) return "";
  const str = String(idCard).trim();
  const head = options?.head ?? 6;
  const tail = options?.tail ?? 4;
  const maskChar = options?.maskChar ?? "*";

  if (str.length <= head + tail) {
    return str;
  }

  const maskLen = str.length - head - tail;
  return `${str.slice(0, head)}${maskChar.repeat(maskLen)}${str.slice(-tail)}`;
}
