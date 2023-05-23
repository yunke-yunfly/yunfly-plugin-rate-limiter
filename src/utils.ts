export const isIncludes = (paths: string[], path: string) => {
  const result = paths.filter((item: any) => item.indexOf(path) > -1) || [];
  return !!result.length;
};

export const getErrorCodeAndSetHttpCode = (
  ctx: any,
  httpCode: number,
  sameCode: boolean = false,
) => {
  const errorConfig = ctx?.config?.error;

  if (errorConfig?.enableHttpCode) {
    // 加判断逻辑
    ctx.status = httpCode;
  }

  if (sameCode) return httpCode;
  const code = getConfigErrorCodeNumber(errorConfig?.errCode);
  return code;
};

// 获取配置的数字类型
export type Key = number | string;
export type ErrorCode = number | true | Record<Key, Key>;
export function getConfigErrorCodeNumber(errorCode?: ErrorCode) {
  const defaultCode = 2;
  if (typeof errorCode === 'number') return errorCode;
  if (errorCode && typeof errorCode === 'object' && errorCode['*']) return errorCode['*'];
  return defaultCode;
}
