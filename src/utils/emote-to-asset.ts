import { Platform } from '../enums.js';
import type {
  SevenEmoteFile,
  SevenEmoteInSet,
  SevenEmoteNotInSet,
  BTTVEmote,
  FFZEmote,
  TwitchEmote,
  AssetInfo
} from '../types.js';

const EMOTESIZE = 2;
const HTTPS = 'https';
const BTTVCDN = 'cdn.betterttv.net/emote';
const TWITCHCDN = 'static-cdn.jtvnw.net/emoticons/v2';

export function sevenInSetToAsset(emote: SevenEmoteInSet, size?: number): AssetInfo {
  const { name, data } = emote;
  const { flags, host, animated } = data;
  const filename = `${size ?? EMOTESIZE}x.${animated ? 'gif' : 'png'}`;
  const file = host.files.find((f: SevenEmoteFile) => f.name === filename);
  return {
    name: name,
    url: `${HTTPS}:${host.url}/${file?.name}`,
    zeroWidth: !!(256 & flags),
    animated: animated,
    width: file?.width,
    height: file?.height,
    platform: Platform.sevenInSet
  };
}

export function sevenNotInSetToAsset(emote: SevenEmoteNotInSet, size?: number): AssetInfo {
  const { name, flags, host, animated } = emote;
  const filename = `${size ?? EMOTESIZE}x.${animated ? 'gif' : 'png'}`;
  const file = host.files.find((f: SevenEmoteFile) => f.name === filename);
  return {
    name: name,
    url: `${HTTPS}:${host.url}/${file?.name}`,
    zeroWidth: !!(256 & flags),
    animated: animated,
    width: file?.width,
    height: file?.height,
    platform: Platform.sevenNotInSet
  };
}

export function bttvToAsset(emote: BTTVEmote): AssetInfo {
  const { id, code, animated } = emote;
  const filename = `${EMOTESIZE}x.${animated ? 'gif' : 'png'}`;
  return {
    name: code,
    url: `${HTTPS}://${BTTVCDN}/${id}/${filename}`,
    zeroWidth: false,
    animated: animated,
    width: undefined,
    height: undefined,
    platform: Platform.bttv
  };
}

export function ffzToAsset(emote: FFZEmote): AssetInfo {
  const { name, urls } = emote;
  return {
    name: name,
    url: urls[`${EMOTESIZE}`],
    zeroWidth: false,
    animated: false,
    width: undefined,
    height: undefined,
    platform: Platform.ffz
  };
}

export function twitchToAsset(emote: TwitchEmote): AssetInfo {
  const { name, id, format, theme_mode } = emote;
  const animated = format.length === 2;
  const chosenFormat = animated ? format[1] : format[0];
  const chosenThemeMode = theme_mode.length === 2 ? theme_mode[1] : theme_mode[0];
  return {
    name: name,
    url: `${HTTPS}://${TWITCHCDN}/${id}/${chosenFormat}/${chosenThemeMode}/${EMOTESIZE}.0`,
    zeroWidth: false,
    animated: animated,
    width: undefined,
    height: undefined,
    platform: Platform.twitch
  };
}
