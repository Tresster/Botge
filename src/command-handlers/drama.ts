/** @format */

import type { ChatInputCommandInteraction } from 'discord.js';

import type { RedditApi } from '../api/reddit-api.ts';
import type { Guild } from '../guild.ts';

const { EMBED_SERVER_REDDIT } = process.env;

export function dramaHandler(redditApi: Readonly<RedditApi> | undefined) {
  return async (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>): Promise<void> => {
    const defer = interaction.deferReply();

    try {
      if (EMBED_SERVER_REDDIT === undefined || redditApi === undefined) {
        await defer;
        await interaction.editReply('Drama command is unavailable right now.');
        return;
      }

      const livestreamFails = await redditApi.getLivestreamFails();
      for (const { data } of livestreamFails.data.children) {
        if (data.over_18) continue;

        await defer;
        await interaction.editReply(`${EMBED_SERVER_REDDIT}${data.permalink}`);
        return;
      }

      await defer;
      await interaction.editReply(`Can't get drama right now.`);
    } catch (error) {
      console.log(`Error at dramaHandler --> ${error instanceof Error ? error.message : String(error)}`);

      await defer;
      await interaction.editReply('Failed to get drama.');
    }
  };
}
