/** @format */

import fetch from 'node-fetch';
import { writeFileSync } from 'node:fs';

import { getRedditAccessToken } from '../utils/api/reddit-api-utils.ts';
import { fetchAndJson } from '../utils/fetch-and-json.ts';
import { REDDIT_API_ENDPOINTS, REDDIT_ACCESS_TOKEN_PATH } from '../paths-and-endpoints.ts';

type RedditGlobalOptions = {
  readonly method: string;
  readonly headers: {
    readonly Authorization: string;
  };
};

type RedditLivestreamFails = {
  readonly data: {
    readonly children: readonly {
      readonly data: {
        readonly permalink: string;
        readonly over_18: boolean;
      };
    }[];
  };
};

export class RedditApi {
  readonly #clientId: string;
  readonly #secret: string;
  #accessToken: string;

  public constructor(clientId: string, secret: string, accessToken: string) {
    this.#clientId = clientId;
    this.#secret = secret;
    this.#accessToken = accessToken;
  }

  get #apiRequestOptions(): RedditGlobalOptions {
    const optionsTwitchGlobal: RedditGlobalOptions = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.#accessToken}`
      }
    };

    return optionsTwitchGlobal;
  }

  public async validateAndGetNewAccessTokenIfInvalid(): Promise<void> {
    const resp = await fetch(REDDIT_API_ENDPOINTS.accessTokenValidate, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.#accessToken}`
      }
    });

    if (resp.status === 403) {
      this.#accessToken = await getRedditAccessToken(this.#clientId, this.#secret);
      writeFileSync(REDDIT_ACCESS_TOKEN_PATH, this.#accessToken, { encoding: 'utf8', flag: 'w' });
    }
  }

  public async getLivestreamFails(): Promise<RedditLivestreamFails> {
    const query = `hot.json`;
    const query2 = 'limit=5';

    const x = await fetchAndJson(`${REDDIT_API_ENDPOINTS.livestreamFail}/${query}?${query2}`, this.#apiRequestOptions);
    console.log(x);
    return x as RedditLivestreamFails;
  }
}
