import { getTwitchAccessToken } from '../utils/api/twitch-api-utils.ts';
import { fetchAndJson } from '../utils/fetch-and-json.ts';
import type { TwitchClips, TwitchGames, TwitchGlobalEmotes, TwitchGlobalOptions, TwitchUsers } from '../types.ts';
import { TWITCH_API_ENDPOINTS } from '../paths-and-endpoints.ts';

// raw twitch api methods
export class TwitchApi {
  readonly #clientId: string;
  readonly #secret: string;
  #accessToken: string;

  public constructor(clientId: string, secret: string, accessToken: string) {
    this.#clientId = clientId;
    this.#secret = secret;
    this.#accessToken = accessToken;
  }

  get #apiRequestOptions(): TwitchGlobalOptions {
    const optionsTwitchGlobal: TwitchGlobalOptions = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.#accessToken}`,
        'Client-Id': this.#clientId
      }
    };

    return optionsTwitchGlobal;
  }

  public async validateAccessToken(): Promise<void> {
    const resp = await fetch(TWITCH_API_ENDPOINTS.accessTokenValidate, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.#accessToken}`
      }
    });

    if (resp.status === 401) this.#accessToken = await getTwitchAccessToken(this.#clientId, this.#secret);
  }

  public async clipsFromIds(ids: Readonly<Iterable<string>>): Promise<TwitchClips> {
    const idsArray: readonly string[] = [...ids];
    if (idsArray.length > 100) throw new Error('Cannot get more than 100 users at once');

    const query: string = idsArray.map((id) => `id=${id}`).join('&');
    return (await fetchAndJson(`${TWITCH_API_ENDPOINTS.clips}?${query}`, this.#apiRequestOptions)) as TwitchClips;
  }

  public async clipsFromBroadcasterId(broadcasterId: string, cursor?: string): Promise<TwitchClips> {
    const query = `broadcaster_id=${broadcasterId}`;
    const query2 = cursor !== undefined ? `&after=${cursor}` : '';

    return (await fetchAndJson(
      `${TWITCH_API_ENDPOINTS.clips}?${query}&first=100${query2}`,
      this.#apiRequestOptions
    )) as TwitchClips;
  }

  public async games(ids: Readonly<Iterable<string>>): Promise<TwitchGames> {
    const idsArray: readonly string[] = [...ids];
    if (idsArray.length > 100) throw new Error('Cannot get more than 100 users at once');

    const query: string = idsArray.map((id) => `id=${id}`).join('&');
    return (await fetchAndJson(`${TWITCH_API_ENDPOINTS.games}?${query}`, this.#apiRequestOptions)) as TwitchGames;
  }

  public async users(ids: Readonly<Iterable<string>>): Promise<TwitchUsers> {
    const idsArray: readonly string[] = [...ids];
    if (idsArray.length > 100) throw new Error('Cannot get more than 100 users at once');

    const query: string = idsArray.map((id) => `login=${id}`).join('&');
    return (await fetchAndJson(`${TWITCH_API_ENDPOINTS.users}?${query}`, this.#apiRequestOptions)) as TwitchUsers;
  }

  public async emotesGlobal(): Promise<TwitchGlobalEmotes> {
    return (await fetchAndJson(TWITCH_API_ENDPOINTS.emotesGlobal, this.#apiRequestOptions)) as TwitchGlobalEmotes;
  }
}
