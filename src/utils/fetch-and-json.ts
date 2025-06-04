import fetch, { type RequestInit } from 'node-fetch';

export async function fetchAndJson(url: string, init?: RequestInit, dontCheckOk?: boolean): Promise<unknown> {
  const fetched = await fetch(url, init);
  //if ((dontCheckOk === undefined || !dontCheckOk) && !fetched.ok) throw new Error(`${url} fetch not ok.`);

  return await fetched.json();
}
