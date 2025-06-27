import { type TwitchApi } from '../api/twitch-api.ts';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Guild } from '../guild.ts';
import { escapeMarkdown } from 'discord.js';

export function bannedHandler(twitchApi: Readonly<TwitchApi> | undefined) {
  return async (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>): Promise<void> => {
    if (twitchApi === undefined) {
      await interaction.reply('Twitch API is not available right now.');
      return;
    }

    const defer = interaction.deferReply();
    try {
      const username = 'CuteDog_';
      if (username === undefined) {
        await defer;
        await interaction.editReply('Please provide a username.');
        return;
      }

      const users = await twitchApi.users([username]);
      // if banned it would return an empty array
      const banned: boolean = users.data.length === 0;

      await defer;
      if (banned) {
        await interaction.editReply(
          `${escapeMarkdown(username)} is currently **BANNED** on Twitch <:nooo:1254033129270804594>`
        );
      } else {
        await interaction.editReply(
          `${escapeMarkdown(username)} is currently **NOT BANNED** on Twitch <:wahoo:1323940324669919285>`
        );
      }
    } catch (error) {
      console.error(error);
      await defer;
      await interaction.editReply('An error occurred while fetching banned users.');
    }
  };
}
