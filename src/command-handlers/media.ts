/** @format */

import { MessageFlags, type ChatInputCommandInteraction } from 'discord.js';

import { getOptionValueWithoutUndefined } from '../utils/get-option-value.ts';
import type { MediaDatabase } from '../api/media-database.ts';
import type { Guild } from '../guild.ts';
import { GUILD_ID_CUTEDOG } from '../guilds.ts';

export function mediaHandler(mediaDataBase: Readonly<MediaDatabase>) {
  return async (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>): Promise<void> => {
    try {
      const name = getOptionValueWithoutUndefined<string>(interaction, 'name');
      const mediaUrl = ((): string | undefined => {
        const mediaUrl_ = mediaDataBase.getMediaUrl(interaction.user.id, name);
        if (mediaUrl_ !== undefined) return mediaUrl_;

        return mediaDataBase.getMediaUrl(interaction.user.id, name.toLowerCase());
      })();

      const mediaNotFoundReply = interaction.guildId === GUILD_ID_CUTEDOG ? 'jij' : 'Media not found.';

      if (mediaUrl === undefined) {
        await interaction.reply({ content: mediaNotFoundReply, flags: MessageFlags.Ephemeral });
        return;
      }

      await interaction.reply(mediaUrl);
    } catch (error) {
      console.log(`Error at mediaHandler --> ${error instanceof Error ? error.message : String(error)}`);

      await interaction.reply({
        content: 'Something went wrong. Please try again later.',
        flags: MessageFlags.Ephemeral
      });
    }
  };
}
