/** @format */
import type { TwitchClips, TwitchGames, TwitchGlobalEmotes, TwitchUsers } from '../types.ts';
export declare class TwitchApi {
  #private;
  constructor(clientId: string, secret: string, accessToken: string);
  validateAndGetNewAccessTokenIfInvalid(): Promise<void>;
  clipsFromIds(ids: Readonly<Iterable<string>>): Promise<TwitchClips>;
  clipsFromBroadcasterId(broadcasterId: string, cursor?: string): Promise<TwitchClips>;
  games(ids: Readonly<Iterable<string>>): Promise<TwitchGames>;
  users(ids: Readonly<Iterable<string>>): Promise<TwitchUsers>;
  emotesGlobal(): Promise<TwitchGlobalEmotes>;
}
