import { Platform } from './enums.ts';

export const DATABASE_DIR = 'data';
export const TMP_DIR = 'tmp';

export const DATABASE_ENDPOINTS = {
  addedEmotes: `${DATABASE_DIR}/addedEmotes.sqlite`,
  pings: `${DATABASE_DIR}/pings.sqlite`,
  permitRoleIds: `${DATABASE_DIR}/permitRoleIds.sqlite`,
  broadcasterNameAndpersonalEmoteSets: `${DATABASE_DIR}/broadcasterNameAndPersonalEmoteSets.sqlite`
};

export const CDN_ENDPOINTS = {
  sevenTVNotInSet: 'https://7tv.io/v3/emotes',
  bttv: 'cdn.betterttv.net/emote',
  twitch: 'static-cdn.jtvnw.net/emoticons/v2'
};

export const TWITCH_API_ENDPOINTS = {
  accessToken: 'https://id.twitch.tv/oauth2/token',
  accessTokenValidate: 'https://id.twitch.tv/oauth2/validate',
  users: 'https://api.twitch.tv/helix/users',
  games: 'https://api.twitch.tv/helix/games',
  clips: 'https://api.twitch.tv/helix/clips',
  emotesGlobal: 'https://api.twitch.tv/helix/chat/emotes/global'
};

export const GLOBAL_EMOTE_ENDPOINTS = {
  sevenTV: 'https://7tv.io/v3/emote-sets/global',
  bttv: 'https://api.betterttv.net/3/cached/emotes/global',
  ffz: 'https://api.frankerfacez.com/v1/set/global'
};

/*
export const PERSONAL_EMOTE_ENDPOINTS = {
  cutedog: new PersonalE(moteEndpoints
    'https://7tv.io/v3/emote-sets/01FDMJPSF8000CJ4MDR2FNZEQ3',
    'https://api.betterttv.net/3/users/5809977263c97c037fc9e66c',
    'https://api.frankerfacez.com/v1/room/cutedog_'
  )
};
*/

export const EMOTE_ENDPOINTS = new Map<Platform, string>([
  [Platform.sevenInSet, 'https://7tv.app/emotes/'],
  [Platform.sevenNotInSet, 'https://7tv.app/emotes/'],
  [Platform.bttv, 'https://betterttv.com/emotes/'],
  [Platform.ffz, 'https://www.frankerfacez.com/emoticon/']
]);
