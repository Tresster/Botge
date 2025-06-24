import type { OmitPartialGroupDMChannel, Message } from 'discord.js';

import type { Guild } from '../guild.ts';
import type { AssetInfo } from '../types.ts';

const COMMAND_IDENTIFIER = '+';

export function messageCreateHandler() {
  return async (message: OmitPartialGroupDMChannel<Message>, guild: Readonly<Guild>): Promise<void> => {
    try {
      const { content } = message;
      if (!content.startsWith(COMMAND_IDENTIFIER)) return;

      const emote = ((): AssetInfo | undefined => {
        const { emoteMatcher } = guild;
        const contentWithoutComamndIdentifier = content.slice(COMMAND_IDENTIFIER.length);

        return emoteMatcher.matchSingle(contentWithoutComamndIdentifier);
      })();

      if (emote === undefined) return;
      await message.reply({ content: emote.url.replace('.gif', '.webp'), allowedMentions: { repliedUser: false } });
    } catch (error) {
      console.log(`Error at messageCreateHandler --> ${error instanceof Error ? error.message : String(error)}`);
    }
  };
}
