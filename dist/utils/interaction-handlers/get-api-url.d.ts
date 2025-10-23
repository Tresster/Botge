/** @format */
import type { TwitchApi } from '../../api/twitch-api.ts';
export type ApiUrlMessage =
  | {
      readonly type: 'success';
      readonly url: string;
      readonly ownerUsername?: string;
    }
  | {
      readonly type: 'error';
      readonly message: string;
    }
  | {
      readonly type: 'feedback';
      readonly message: string;
    };
export declare function getSevenTvEmoteSetLinkFromSevenTvApiUlr(sevenTvEmoteSetApiUrl: string): string;
export declare function getSevenTvApiUrlFromSevenTvEmoteSetLink(sevenTvEmoteSetLink: string): Promise<ApiUrlMessage>;
export declare function getBttvApiUrlFromBroadcasterName(
  broadcasterName: string,
  twitchApi: Readonly<TwitchApi> | undefined
): Promise<ApiUrlMessage>;
export declare function getFfzApiUrlFromBroadcasterName(broadcasterName: string): Promise<ApiUrlMessage>;
