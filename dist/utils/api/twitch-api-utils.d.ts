/** @format */
import type { TwitchApi } from '../../api/twitch-api.ts';
import type { TwitchClip } from '../../types.ts';
export declare function getTwitchAccessToken(clientId: string, clientSecret: string): Promise<string>;
export declare function getClipsWithGameNameFromIds(
  twitchApi: Readonly<TwitchApi>,
  ids: Readonly<Iterable<string>>
): Promise<TwitchClip[]>;
export declare function getClipsWithGameNameFromBroadcasterName(
  twitchApi: Readonly<TwitchApi>,
  broadcasterName: string,
  cursor?: string
): Promise<readonly [TwitchClip[], string | undefined]>;
