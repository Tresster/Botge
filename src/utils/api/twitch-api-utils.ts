import type { TwitchApi } from '../../api/twitch-api.js';
import type { ClientCredentialsGrantFlow, TwitchClip, TwitchClips } from '../../types.js';
import { TWITCH_API_ENDPOINTS } from '../../paths-and-endpoints.js';

export async function getTwitchAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const resp = await fetch(TWITCH_API_ENDPOINTS.accessToken, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`
  });

  if (!resp.ok) throw new Error(`Cannot get access token from twitch: ${resp.status}`);

  return ((await resp.json()) as ClientCredentialsGrantFlow).access_token;
}

async function transformClipsGameIdFromIdToNameAndTransformCreatedAt(
  twitchApi: Readonly<TwitchApi>,
  twitchClips: TwitchClips
): Promise<TwitchClip[]> {
  const gameIds = new Set(twitchClips.data.map((twitchClip) => twitchClip.game_id));
  const games = await twitchApi.games([...gameIds.keys()]);

  return twitchClips.data.map((twitchClip) => {
    const gameName = games.data.find((game) => game.id === twitchClip.game_id)?.name;
    return {
      ...twitchClip,
      created_at: twitchClip.created_at.split('T')[0],
      game_id: gameName ?? twitchClip.game_id
    } as TwitchClip;
  });
}

// max 100 ids
export async function getClipsWithGameNameFromIds(
  twitchApi: Readonly<TwitchApi>,
  ids: Readonly<Iterable<string>>
): Promise<TwitchClip[]> {
  const clips = await twitchApi.clipsFromIds(ids);

  return transformClipsGameIdFromIdToNameAndTransformCreatedAt(twitchApi, clips);
}

export async function getClipsWithGameNameFromBroadcasterName(
  twitchApi: Readonly<TwitchApi>,
  broadcasterName: string,
  cursor?: string
): Promise<readonly [TwitchClip[], string | undefined]> {
  const users = await twitchApi.users([broadcasterName]);
  const broadcasterId = users.data[0].id;

  const clips = await twitchApi.clipsFromBroadcasterId(broadcasterId, cursor);
  const transformClipsGameIdFromIdToName_ = await transformClipsGameIdFromIdToNameAndTransformCreatedAt(
    twitchApi,
    clips
  );

  return [transformClipsGameIdFromIdToName_, clips.pagination.cursor];
}
