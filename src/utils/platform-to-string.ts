/** @format */

import { Platform } from '../enums.ts';

const SEVEN_IN_SET_STRING = '7TV';
const SEVEN_NOT_IN_SET_STRING = '7TV | Added Emote';
const BTTV_STRING = 'BTTV';
const FFZ_STRING = 'FFZ';
const TWITCH_STRING = 'Twitch';

export function platformStrings(): readonly string[] {
  return [SEVEN_IN_SET_STRING, SEVEN_NOT_IN_SET_STRING, BTTV_STRING, FFZ_STRING, TWITCH_STRING];
}

export function platformToString(platform: Platform): string {
  if (platform === Platform.sevenInSet) return SEVEN_IN_SET_STRING;
  else if (platform === Platform.sevenNotInSet) return SEVEN_NOT_IN_SET_STRING;
  else if (platform === Platform.bttv) return BTTV_STRING;
  else if (platform === Platform.ffz) return FFZ_STRING;
  return TWITCH_STRING;
}

export function stringToPlatform(platform: string): Platform {
  if (platform === SEVEN_IN_SET_STRING) return Platform.sevenInSet;
  else if (platform === SEVEN_NOT_IN_SET_STRING) return Platform.sevenNotInSet;
  else if (platform === BTTV_STRING) return Platform.bttv;
  else if (platform === FFZ_STRING) return Platform.ffz;
  return Platform.twitch;
}
