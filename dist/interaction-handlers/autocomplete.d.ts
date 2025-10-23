/** @format */
import type { Index } from 'meilisearch';
import type { AutocompleteInteraction } from 'discord.js';
import type { EmoteMatcher } from '../emote-matcher.ts';
export declare function autocompleteHandler(
  emoteMatcher: Readonly<EmoteMatcher>,
  twitchClipsMeiliSearchIndex: Index | undefined,
  uniqueCreatorNames: readonly string[] | undefined,
  uniqueGameIds: readonly string[] | undefined
): (interaction: AutocompleteInteraction) => Promise<void>;
