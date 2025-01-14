import { Guild } from '../../guild.js';
import type { PersonalEmoteEndpoints } from '../../paths-and-endpoints.js';
import { PersonalEmoteMatcherConstructor } from '../../emote-matcher-constructor.js';
import type { TwitchClipsMeiliSearch } from '../../twitch-clips-meili-search.js';
import type { AddedEmotesDatabase } from '../../api/added-emotes-database.js';

export async function newGuild(
  guildIds: readonly string[],
  broadcasterName: string | undefined,
  twitchClipsMeiliSearch: Readonly<TwitchClipsMeiliSearch> | undefined,
  addedEmotesDatabase: Readonly<AddedEmotesDatabase>,
  personalEmoteEndpoints: Readonly<PersonalEmoteEndpoints> | undefined
): Promise<Readonly<Guild>> {
  addedEmotesDatabase.createTable(guildIds);

  const personalEmoteMatcherConstructor = PersonalEmoteMatcherConstructor.create(guildIds, personalEmoteEndpoints);
  const emoteMatcher = (await personalEmoteMatcherConstructor).constructEmoteMatcher();
  const twitchClipsMeiliSearchIndex =
    broadcasterName !== undefined ? twitchClipsMeiliSearch?.getOrCreateIndex(guildIds) : undefined;

  return new Guild(
    guildIds,
    broadcasterName,
    await twitchClipsMeiliSearchIndex,
    await emoteMatcher,
    await personalEmoteMatcherConstructor
  );
}
