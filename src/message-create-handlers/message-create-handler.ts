/** @format */

import type { OmitPartialGroupDMChannel, Message } from 'discord.js';

import type { Guild } from '../guild.ts';
import { EMOTE_COMMAND_IDENTIFIER, emotesHandler } from '../command-handlers/emote.ts';
import type { CachedUrl } from '../api/cached-url.ts';

export function messageCreateHandler() {
  return async (
    cachedUrl: Readonly<CachedUrl>,
    message: OmitPartialGroupDMChannel<Message>,
    guild: Readonly<Guild>
  ): Promise<void> => {
    try {
      const { content } = message;
      if (!content.startsWith(EMOTE_COMMAND_IDENTIFIER)) return;
      if (content[EMOTE_COMMAND_IDENTIFIER.length] === ' ') return;

      await emotesHandler(cachedUrl)(guild, undefined, message);
    } catch (error) {
      console.log(`Error at messageCreateHandler --> ${error instanceof Error ? error.message : String(error)}`);
    }
  };
}
