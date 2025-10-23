/** @format */
import type { OmitPartialGroupDMChannel, Message } from 'discord.js';
import type { Guild } from '../guild.ts';
import type { CachedUrl } from '../api/cached-url.ts';
export declare function messageCreateHandler(): (
  cachedUrl: Readonly<CachedUrl>,
  message: OmitPartialGroupDMChannel<Message>,
  guild: Readonly<Guild>
) => Promise<void>;
