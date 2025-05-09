import type { Index } from 'meilisearch';
import type { CommandInteraction } from 'discord.js';
import type { TwitchClip, ReadonlyHit } from '../types.js';
import { TwitchClipMessageBuilder } from '../message-builders/twitch-clip-message-builder.js';

export function clipHandler(twitchClipsMeiliSearchIndex: Index) {
  return async (interaction: CommandInteraction): Promise<TwitchClipMessageBuilder | undefined> => {
    const defer = interaction.deferReply();
    try {
      const title = ((): string | undefined => {
        const titleOptions = interaction.options.get('title')?.value;
        return titleOptions !== undefined ? String(titleOptions).trim().toLowerCase() : undefined;
      })();
      const clipper = ((): string | undefined => {
        const clipperOptions = interaction.options.get('clipper')?.value;
        return clipperOptions !== undefined ? String(clipperOptions).trim() : undefined;
      })();
      const game = ((): string | undefined => {
        const gameOptions = interaction.options.get('game')?.value;
        return gameOptions !== undefined ? String(gameOptions).trim() : undefined;
      })();
      const sortBy = ((): string | undefined => {
        const sortOptions = interaction.options.get('sortby')?.value;
        return sortOptions !== undefined ? String(sortOptions).trim() : undefined;
      })();
      const sortByField = ((): string | undefined => {
        if (sortBy === 'created') return 'created_at';
        else return undefined;
      })();

      const filter = ((): string => {
        const filter_: string[] = [];
        const clipperFilter = clipper !== undefined ? `creator_name = ${clipper}` : undefined;
        const gameFilter = game !== undefined ? `game_id = "${game}"` : undefined;

        if (clipperFilter !== undefined) filter_.push(clipperFilter);
        if (gameFilter !== undefined) filter_.push(gameFilter);

        if (filter_.length >= 2) return filter_.join(' AND ');
        else if (filter_.length === 1) return filter_[0];
        else return '';
      })();

      const { maxTotalHits } = await twitchClipsMeiliSearchIndex.getPagination();
      if (maxTotalHits === null || maxTotalHits === undefined) throw new Error('pagination max total hits not set');

      const search = await twitchClipsMeiliSearchIndex.search(title ?? '', {
        filter: filter,
        matchingStrategy: 'all',
        sort: sortByField !== undefined ? [`${sortByField}:desc`] : ['view_count:desc'],
        limit: maxTotalHits
      });
      const hits: readonly TwitchClip[] = search.hits.map((hit: ReadonlyHit) => hit as TwitchClip);

      if (hits.length === 0) {
        await defer;
        await interaction.editReply('Could not find clip.');
        return undefined;
      } else if (hits.length === 1) {
        await defer;
        await interaction.editReply(hits[0].url);
        return undefined;
      }

      const twitchClipMessageBuilder = new TwitchClipMessageBuilder(interaction, hits, sortBy);
      const reply = twitchClipMessageBuilder.first();
      await defer;

      if (reply === undefined) return undefined;
      await interaction.editReply(reply);
      return twitchClipMessageBuilder;
    } catch (error) {
      console.log(`Error at clipHandler --> ${error instanceof Error ? error.message : String(error)}`);

      await defer;
      await interaction.editReply('failed to get clip.');
      return undefined;
    }
  };
}
