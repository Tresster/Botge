import { TwitchApi } from '../../api/twitch-api.js';
import { getTwitchAccessToken } from '../api/twitch-api-utils.js';

export async function newTwitchApi(twitchClientId: string, twitchSecret: string): Promise<Readonly<TwitchApi>> {
  const accessToken = await getTwitchAccessToken(twitchClientId, twitchSecret);
  const twitchApi: Readonly<TwitchApi> = new TwitchApi(twitchClientId, twitchSecret, accessToken);
  await twitchApi.validateAccessToken();
  return twitchApi;
}
