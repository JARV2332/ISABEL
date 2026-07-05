/** Prefijo cuando ISABEL vive bajo edukidsgt.com/ISABEL */
export const BASE_PATH =
  process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ??
  (process.env.NODE_ENV === "production" ? "/ISABEL" : "");

export function withBasePath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${normalized}`;
}
