/** @format */
import { TwitchApi } from '../../api/twitch-api.ts';
export declare function newTwitchApi(twitchClientId: string, twitchSecret: string): Promise<Readonly<TwitchApi>>;
