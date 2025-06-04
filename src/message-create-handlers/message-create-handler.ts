import type { OmitPartialGroupDMChannel, Message } from 'discord.js';

import type { Guild } from '../guild.ts';

const COMMAND_IDENTIFIER = '+';

export function messageCreateHandler() {
  return async (message: OmitPartialGroupDMChannel<Message>, guild: Readonly<Guild>): Promise<void> => {
    try {
      const { content } = message;
      if (!content.startsWith(COMMAND_IDENTIFIER)) return;

      const { emoteMatcher } = guild;
      const contentWithoutComamndIdentifier = content.slice(COMMAND_IDENTIFIER.length);
      const emote = emoteMatcher.matchSingle(contentWithoutComamndIdentifier);

      if (emote === undefined) return;
      await message.reply(emote.url.replace('.gif', '.webp'));
    } catch (error) {
      console.log(`Error at messageCreateHandler --> ${error instanceof Error ? error.message : String(error)}`);
    }
  };
}
