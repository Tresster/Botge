/** @format */

import { Platform } from './enums.ts';

export const DATABASE_DIR = 'data' as const;
export const TMP_DIR = 'tmp' as const;

export const TWITCH_ACCESS_TOKEN_PATH = `${DATABASE_DIR}/twitchAccessToken.txt` as const;

export const DATABASE_ENDPOINTS = {
  addedEmotes: `${DATABASE_DIR}/addedEmotes.sqlite`,
  pings: `${DATABASE_DIR}/pings.sqlite`,
  permitRoleIds: `${DATABASE_DIR}/permitRoleIds.sqlite`,
  broadcasterNameAndpersonalEmoteSets: `${DATABASE_DIR}/broadcasterNameAndPersonalEmoteSets.sqlite`,
  users: `${DATABASE_DIR}/users.sqlite`
} as const;

export const CDN_ENDPOINTS = {
  sevenTVNotInSet: 'https://7tv.io/v3/emotes',
  bttv: 'cdn.betterttv.net/emote',
  twitch: 'static-cdn.jtvnw.net/emoticons/v2'
} as const;

export const TWITCH_API_ENDPOINTS = {
  accessToken: 'https://id.twitch.tv/oauth2/token',
  accessTokenValidate: 'https://id.twitch.tv/oauth2/validate',
  users: 'https://api.twitch.tv/helix/users',
  games: 'https://api.twitch.tv/helix/games',
  clips: 'https://api.twitch.tv/helix/clips',
  emotesGlobal: 'https://api.twitch.tv/helix/chat/emotes/global'
} as const;

export const GLOBAL_EMOTE_ENDPOINTS = {
  sevenTV: 'https://7tv.io/v3/emote-sets/global',
  bttv: 'https://api.betterttv.net/3/cached/emotes/global',
  ffz: 'https://api.frankerfacez.com/v1/set/global'
} as const;

export const EMOTE_ENDPOINTS: Readonly<Map<Platform, string>> = new Map<Platform, string>([
  [Platform.sevenInSet, 'https://7tv.app/emotes/'],
  [Platform.sevenNotInSet, 'https://7tv.app/emotes/'],
  [Platform.bttv, 'https://betterttv.com/emotes/'],
  [Platform.ffz, 'https://www.frankerfacez.com/emoticon/']
]);
