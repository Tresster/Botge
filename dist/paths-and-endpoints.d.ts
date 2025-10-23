/** @format */
import { Platform } from './enums.ts';
export declare const DATABASE_DIR = 'data';
export declare const TMP_DIR = 'tmp';
export declare const TWITCH_ACCESS_TOKEN_PATH: string;
export declare const DATABASE_ENDPOINTS: {
  addedEmotes: string;
  pings: string;
  permitRoleIds: string;
  broadcasterNameAndpersonalEmoteSets: string;
  users: string;
};
export declare const CDN_ENDPOINTS: {
  sevenTVNotInSet: string;
  bttv: string;
  twitch: string;
};
export declare const TWITCH_API_ENDPOINTS: {
  accessToken: string;
  accessTokenValidate: string;
  users: string;
  games: string;
  clips: string;
  emotesGlobal: string;
};
export declare const GLOBAL_EMOTE_ENDPOINTS: {
  sevenTV: string;
  bttv: string;
  ffz: string;
};
export declare const EMOTE_ENDPOINTS: Readonly<Map<Platform, string>>;
