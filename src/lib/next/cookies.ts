import { cookies as nextCookies, headers as nextHeaders } from 'next/headers';

export type CookieStore = Awaited<ReturnType<typeof nextCookies>>;
export async function cookiesAsync(): Promise<CookieStore> {
  const c = nextCookies() as any;
  return typeof c?.then === 'function' ? await c : c;
}

export async function getCookie(name: string): Promise<string | undefined> {
  const store = await cookiesAsync();
  return store.get(name)?.value;
}

export async function headersAsync(): Promise<Awaited<ReturnType<typeof nextHeaders>>> {
  const h = nextHeaders() as any;
  return typeof h?.then === 'function' ? await h : h;
}
