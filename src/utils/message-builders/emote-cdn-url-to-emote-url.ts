/** @format */

import { EMOTE_ENDPOINTS, CDN_ENDPOINTS } from '../../paths-and-endpoints.ts';
import type { AssetInfo } from '../../types.ts';
import { Platform } from '../../enums.ts';

export function emoteCdnUrlToEmoteUrl(asset: AssetInfo): string {
  const { id, name, platform, url } = asset;
  if (platform === Platform.twitch) return url;

  const emoteEndpoint = EMOTE_ENDPOINTS.get(platform);
  if (emoteEndpoint === undefined) return url;

  const id_ = platform === Platform.ffz ? `${id}-${name}` : id;
  return `${emoteEndpoint}${id_}`;
}

export function emoteCdnUrlToEmoteApiCdnUrl(asset: AssetInfo): string | undefined {
  const { id, platform } = asset;
  if (platform !== Platform.sevenNotInSet) return undefined;

  return `${CDN_ENDPOINTS.sevenTVNotInSet}/${id}`;
}
