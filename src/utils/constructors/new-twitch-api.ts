import { TwitchApi } from '../../api/twitch-api.ts';
import { getTwitchAccessToken } from '../api/twitch-api-utils.ts';

export async function newTwitchApi(twitchClientId: string, twitchSecret: string): Promise<Readonly<TwitchApi>> {
  const accessToken = await getTwitchAccessToken(twitchClientId, twitchSecret);
  const twitchApi: Readonly<TwitchApi> = new TwitchApi(twitchClientId, twitchSecret, accessToken);
  await twitchApi.validateAccessToken();
  return twitchApi;
}
