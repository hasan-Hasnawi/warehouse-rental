export function safeJsonParse(val: string | undefined | null, fallback: any = null): any {
  if (!val) return fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}
