import type { ChatInputCommandInteraction } from 'discord.js';

import { TwitchClipMessageBuilder } from '../message-builder/twitch-clip-message-builder.js';
import { getOptionValue } from '../utils/get-option-value.js';
import type { TwitchClip, ReadonlyHit } from '../types.js';
import type { Guild } from '../guild.js';

const CLEANUP_MINUTES = 10;
const MAX_TWITCH_CLIP_MESSAGE_BUILDERS_LENGTH = 15;

function shuffle(array: unknown[]): void {
  let currentIndex = array.length;
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
}

export function clipHandler(twitchClipMessageBuilders: TwitchClipMessageBuilder[]) {
  return async (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>): Promise<void> => {
    const { twitchClipsMeiliSearchIndex } = guild;
    if (twitchClipsMeiliSearchIndex === undefined) {
      void interaction.reply('clip command is not available in this server.');
      return;
    }
    if (twitchClipMessageBuilders.length >= MAX_TWITCH_CLIP_MESSAGE_BUILDERS_LENGTH) {
      void interaction.reply(
        `${twitchClipMessageBuilders.length} clip commands are currently in use. Please wait at most ${CLEANUP_MINUTES} minutes.`
      );
      return;
    }

    const defer = interaction.deferReply();
    try {
      const title = getOptionValue<string>(interaction, 'title')?.toLowerCase();
      const clipper = getOptionValue<string>(interaction, 'clipper');
      const category = getOptionValue<string>(interaction, 'category');
      const sortBy = getOptionValue<string>(interaction, 'sortby');
      const sortByField = ((): string => {
        if (sortBy === 'views') return 'view_count:desc';
        else if (sortBy === 'shuffle') return sortBy;
        return 'created_at:desc';
      })();

      const filter = ((): string => {
        const filter_: string[] = [];
        const clipperFilter = clipper !== undefined ? `creator_name = ${clipper}` : undefined;
        const gameFilter = category !== undefined ? `game_id = "${category}"` : undefined;

        if (clipperFilter !== undefined) filter_.push(clipperFilter);
        if (gameFilter !== undefined) filter_.push(gameFilter);

        if (filter_.length >= 2) return filter_.join(' AND ');
        else if (filter_.length === 1) return filter_[0];
        return '';
      })();

      const { maxTotalHits } = await twitchClipsMeiliSearchIndex.getPagination();
      if (maxTotalHits === null || maxTotalHits === undefined) throw new Error('pagination max total hits not set');

      const search = await twitchClipsMeiliSearchIndex.search(title ?? null, {
        filter: filter,
        matchingStrategy: 'all',
        sort: sortByField !== 'shuffle' ? [sortByField] : [],
        limit: maxTotalHits
      });
      const hits: TwitchClip[] = search.hits.map((hit: ReadonlyHit) => hit as TwitchClip);
      if (sortByField === 'shuffle') shuffle(hits);

      if (hits.length === 0) {
        await defer;
        await interaction.editReply('Could not find clip.');
        return;
      } else if (hits.length === 1) {
        await defer;
        await interaction.editReply(hits[0].url);
        return;
      }

      const twitchClipMessageBuilder = new TwitchClipMessageBuilder(interaction, hits, sortBy);
      const reply = twitchClipMessageBuilder.first();
      await defer;

      if (reply === undefined) return;
      await interaction.editReply(reply);
      twitchClipMessageBuilders.push(twitchClipMessageBuilder);
    } catch (error) {
      console.log(`Error at clipHandler --> ${error instanceof Error ? error.message : String(error)}`);

      await defer;
      await interaction.editReply('Failed to get clip.');
    }
  };
}
