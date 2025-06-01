import fetch, { type RequestInit } from 'node-fetch';

export async function fetchAndJson(url: string, options?: RequestInit): Promise<unknown> {
  const fetched = await (options !== undefined ? fetch(url, options) : fetch(url));
  if (!fetched.ok) throw new Error(`${url} fetch not ok.`);

  return await fetched.json();
}
