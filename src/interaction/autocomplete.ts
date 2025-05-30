import type { Index } from 'meilisearch';
import type { AutocompleteInteraction, ApplicationCommandOptionChoiceData } from 'discord.js';

import { platformStrings, platformToString, stringToPlatform } from '../utils/platform-to-string.js';
import { booleanToString, stringToBoolean } from '../utils/boolean-to-string.js';
import { getOptionValue } from '../utils/get-option-value.js';
import { getShortestUniqueSubstrings } from '../command/shortest-unique-substrings.js';
import type { TwitchClip, ReadonlyHit, ReadonlyApplicationCommandOptionChoiceDataString, AssetInfo } from '../types.js';
import type { EmoteMatcher } from '../emote-matcher.js';
import { Platform } from '../enums.js';

const MAX_OPTIONS_LENGTH = 10; //THE MAXIMUM YOU CAN SET HERE IS 25

async function getHitsFromTwitchClipsMeilisearchIndex(
  twitchClipsMeiliSearchIndex: Index,
  query: string
): Promise<readonly TwitchClip[]> {
  const { maxTotalHits } = await twitchClipsMeiliSearchIndex.getPagination();
  if (maxTotalHits === null || maxTotalHits === undefined) throw new Error('pagination max total hits not set');

  const hits: readonly TwitchClip[] = (
    await twitchClipsMeiliSearchIndex.search(query.trim(), {
      sort: ['created_at:desc'],
      limit: maxTotalHits,
      matchingStrategy: 'all'
    })
  ).hits.map((hit: ReadonlyHit) => hit as TwitchClip);

  return hits;
}

function applicableSizes(platform: Platform | undefined): readonly number[] {
  if (platform === Platform.bttv || platform === Platform.twitch) return [1, 2, 3];
  else if (platform === Platform.ffz) return [1, 2, 4];
  else return [1, 2, 3, 4];
}

export function autocompleteHandler(
  emoteMatcher: Readonly<EmoteMatcher>,
  twitchClipsMeiliSearchIndex: Index | undefined,
  uniqueCreatorNames: readonly string[] | undefined,
  uniqueGameIds: readonly string[] | undefined
) {
  return async (interaction: AutocompleteInteraction): Promise<void> => {
    try {
      const interactionCommandName = interaction.commandName;
      const focusedOption = interaction.options.getFocused(true);
      const focusedOptionName = focusedOption.name;
      const focusedOptionValue = focusedOption.value;

      if (interactionCommandName === 'emote') {
        if (focusedOptionName === 'name') {
          const matches =
            emoteMatcher.matchSingleArray(
              focusedOptionValue.trim(),
              undefined,
              undefined,
              undefined,
              MAX_OPTIONS_LENGTH,
              true
            ) ?? [];
          const options: readonly ApplicationCommandOptionChoiceData<string>[] = matches.map((match) => {
            return {
              name: match.name,
              value: match.name
            } as ApplicationCommandOptionChoiceData<string>;
          });

          await interaction.respond(options);
        } else if (focusedOptionName === 'size') {
          const emote = getOptionValue<string>(interaction, 'emote') ?? '';
          const match = emote !== '' ? emoteMatcher.matchSingle(emote) : undefined;
          const applicableSizes_ = match !== undefined ? applicableSizes(match.platform) : applicableSizes(undefined);

          const options: readonly ApplicationCommandOptionChoiceData<number>[] = applicableSizes_.map(
            (applicableSize) => {
              return {
                name: applicableSize.toString(),
                value: applicableSize
              } as ApplicationCommandOptionChoiceData<number>;
            }
          );

          await interaction.respond(options);
        }
      } else if (interactionCommandName === 'emotelist') {
        if (focusedOptionName === 'query') {
          const platform = getOptionValue<Platform>(interaction, 'platform', stringToPlatform);
          const animated = getOptionValue<boolean>(interaction, 'animated', stringToBoolean);
          const overlaying = getOptionValue<boolean>(interaction, 'overlaying', stringToBoolean);

          const matches =
            emoteMatcher.matchSingleArray(
              focusedOptionValue.trim(),
              platform,
              animated,
              overlaying,
              MAX_OPTIONS_LENGTH,
              true
            ) ?? [];
          const options: readonly ApplicationCommandOptionChoiceData<string>[] = matches.map((match) => {
            return {
              name: match.name.trim(),
              value: match.name.trim()
            } as ApplicationCommandOptionChoiceData<string>;
          });

          await interaction.respond(options);
        } else if (focusedOptionName === 'platform') {
          const query = getOptionValue<string>(interaction, 'query') ?? '';
          const animated = getOptionValue<boolean>(interaction, 'animated', stringToBoolean);
          const overlaying = getOptionValue<boolean>(interaction, 'overlaying', stringToBoolean);

          const matches =
            emoteMatcher.matchSingleArray(query, undefined, animated, overlaying) ?? emoteMatcher.matchSingleArray('');
          const platforms: readonly string[] =
            matches !== undefined
              ? [...new Set(matches.map((match) => platformToString(match.platform))).keys()]
              : platformStrings();

          const options: readonly ApplicationCommandOptionChoiceData<string>[] = platforms.map((platform) => {
            return {
              name: platform,
              value: platform
            } as ApplicationCommandOptionChoiceData<string>;
          });

          await interaction.respond(options);
        } else if (focusedOptionName === 'animated' || focusedOptionName === 'overlaying') {
          const query = getOptionValue<string>(interaction, 'query') ?? '';
          const matches = ((): readonly AssetInfo[] | undefined => {
            const platform = getOptionValue<Platform>(interaction, 'platform', stringToPlatform);

            if (focusedOptionName === 'animated') {
              const overlaying = getOptionValue<boolean>(interaction, 'overlaying', stringToBoolean);

              return emoteMatcher.matchSingleArray(query, platform, undefined, overlaying);
            } else {
              const animated = getOptionValue<boolean>(interaction, 'animated', stringToBoolean);

              return emoteMatcher.matchSingleArray(query, platform, animated);
            }
          })();
          const bools = [
            ...new Set(
              matches !== undefined
                ? focusedOptionName === 'animated'
                  ? matches.map((match) => match.animated)
                  : matches.map((match) => match.zeroWidth)
                : []
            ).keys()
          ];

          const options: readonly ApplicationCommandOptionChoiceData<string>[] = bools.map((bool) => {
            return {
              name: booleanToString(bool),
              value: booleanToString(bool)
            } as ApplicationCommandOptionChoiceData<string>;
          });

          await interaction.respond(options);
        }
      } else if (interactionCommandName === 'clip') {
        if (
          twitchClipsMeiliSearchIndex === undefined ||
          uniqueCreatorNames === undefined ||
          uniqueGameIds === undefined
        )
          return;
        if (focusedOptionName === 'title') {
          const category = getOptionValue<string>(interaction, 'category');
          const clipper = getOptionValue<string>(interaction, 'clipper');

          const hits = await (async (): Promise<readonly TwitchClip[]> => {
            let hits_ = await getHitsFromTwitchClipsMeilisearchIndex(
              twitchClipsMeiliSearchIndex,
              focusedOptionValue.trim()
            );

            if (category !== undefined) hits_ = hits_.filter((hit) => hit.game_id === category);
            if (clipper !== undefined) hits_ = hits_.filter((hit) => hit.creator_name === clipper);

            return hits_;
          })();

          const options: readonly ApplicationCommandOptionChoiceData<string>[] = hits.map((clip) => {
            return { name: clip.title, value: clip.title } as ApplicationCommandOptionChoiceData<string>;
          });

          await interaction.respond(
            options.slice(0, MAX_OPTIONS_LENGTH) as readonly ApplicationCommandOptionChoiceData<string>[]
          );
        } else if (focusedOptionName === 'clipper') {
          const title = getOptionValue<string>(interaction, 'title') ?? '';
          const category = getOptionValue<string>(interaction, 'category');

          const currentUniqueCreatorNames = await (async (): Promise<readonly string[]> => {
            if (title === '' && category === undefined) return uniqueCreatorNames;

            const hits = await getHitsFromTwitchClipsMeilisearchIndex(twitchClipsMeiliSearchIndex, title);
            const hitsFiltered = category !== undefined ? hits.filter((hit) => hit.game_id === category) : hits;
            const currentUniqueCreatorNames_ = new Set(hitsFiltered.map((hit) => hit.creator_name)).keys().toArray();
            return currentUniqueCreatorNames_;
          })();

          const options: readonly ApplicationCommandOptionChoiceData<string>[] = currentUniqueCreatorNames
            .filter((uniqueCreatorName) => uniqueCreatorName.toLowerCase().includes(focusedOptionValue.trim()))
            .map((uniqueCreatorName) => {
              return {
                name: uniqueCreatorName,
                value: uniqueCreatorName
              } as ApplicationCommandOptionChoiceData<string>;
            });

          await interaction.respond(
            options.slice(0, MAX_OPTIONS_LENGTH) as readonly ApplicationCommandOptionChoiceData<string>[]
          );
        } else if (focusedOptionName === 'category') {
          const title = getOptionValue<string>(interaction, 'title') ?? '';
          const clipper = getOptionValue<string>(interaction, 'clipper');

          const currentUniqueGameIds = await (async (): Promise<readonly string[]> => {
            if (title === '' && clipper === undefined) return uniqueGameIds;

            const hits = await getHitsFromTwitchClipsMeilisearchIndex(twitchClipsMeiliSearchIndex, title);
            const hitsFiltered = clipper !== undefined ? hits.filter((hit) => hit.creator_name === clipper) : hits;
            const currentUniqueGameIds_ = new Set(hitsFiltered.map((hit) => hit.game_id)).keys().toArray();
            return currentUniqueGameIds_;
          })();

          const options: readonly ApplicationCommandOptionChoiceData<string>[] = currentUniqueGameIds
            .filter((uniqueGameId) => uniqueGameId.toLowerCase().includes(focusedOptionValue.trim()))
            .map((uniqueGameId) => {
              return {
                name: uniqueGameId,
                value: uniqueGameId
              } as ApplicationCommandOptionChoiceData<string>;
            });

          await interaction.respond(
            options.slice(0, MAX_OPTIONS_LENGTH) as readonly ApplicationCommandOptionChoiceData<string>[]
          );
        }
      } else if (interactionCommandName === 'shortestuniquesubstrings') {
        if (focusedOptionName === 'emotes') {
          const focusedOptionValueSplit: readonly string[] = focusedOptionValue.split(/\s+/);
          const focusedOptionValueLast = focusedOptionValueSplit.at(-1) ?? '';
          const focusedOptionValueEverythingButLast = focusedOptionValueSplit
            .slice(0, -1)
            .map((emote) => {
              const [, shortestUniqueSubstrings] = getShortestUniqueSubstrings(emoteMatcher, emote);
              if (shortestUniqueSubstrings !== undefined) return shortestUniqueSubstrings[0];
              else return emote;
            })
            .join(' ');

          const matches =
            emoteMatcher.matchSingleArray(
              focusedOptionValueLast.trim(),
              undefined,
              undefined,
              undefined,
              MAX_OPTIONS_LENGTH,
              true
            ) ?? [];
          const options: readonly ApplicationCommandOptionChoiceData<string>[] = matches.map((match) => {
            const [, shortestUniqueSubstrings] = getShortestUniqueSubstrings(emoteMatcher, match.name);
            const shortestUniqueSubstring =
              shortestUniqueSubstrings !== undefined ? shortestUniqueSubstrings[0] : match.name;

            return {
              name: `${focusedOptionValueEverythingButLast} ${match.name}`.trim(),
              value: `${focusedOptionValueEverythingButLast} ${shortestUniqueSubstring}`.trim()
            } as ApplicationCommandOptionChoiceData<string>;
          });

          if (options.some((option: ReadonlyApplicationCommandOptionChoiceDataString) => option.name.length > 100))
            return;

          await interaction.respond(
            options.slice(0, MAX_OPTIONS_LENGTH) as readonly ApplicationCommandOptionChoiceData<string>[]
          );
        }
      }
    } catch (error) {
      console.log(`Error at autocomplete --> ${error instanceof Error ? error.message : String(error)}`);
    }
  };
}
