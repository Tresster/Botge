import { Guild } from '../../guild.ts';
import type { PersonalEmoteSets } from '../../personal-emote-sets.ts';
import { PersonalEmoteMatcherConstructor } from '../../emote-matcher-constructor.ts';
import type { TwitchClipsMeiliSearch } from '../../twitch-clips-meili-search.ts';
import type { AddedEmotesDatabase } from '../../api/added-emotes-database.ts';
import type { PermittedRoleIdsDatabase } from '../../api/permitted-role-ids-database.ts';

export async function newGuild(
  guildId: string,
  twitchClipsMeiliSearch: Readonly<TwitchClipsMeiliSearch> | undefined,
  addedEmotesDatabase: Readonly<AddedEmotesDatabase>,
  permittedRoleIdsDatabase: Readonly<PermittedRoleIdsDatabase>,
  broadcasterName: string | null,
  personalEmoteSets: PersonalEmoteSets | undefined
): Promise<Readonly<Guild>> {
  addedEmotesDatabase.createTable(guildId);
  permittedRoleIdsDatabase.createTable(guildId);

  const settingsPermittedRoleIds = permittedRoleIdsDatabase.getSettingsPermittedRoleIds(guildId);
  const addEmotePermittedRoleIds = permittedRoleIdsDatabase.getAddEmotePermittedRoleIds(guildId);
  const addEmotePermitNoRole = permittedRoleIdsDatabase.getAddEmotePermitNoRole(guildId);

  const personalEmoteMatcherConstructor = PersonalEmoteMatcherConstructor.create(guildId, personalEmoteSets);
  const emoteMatcher = (await personalEmoteMatcherConstructor).constructEmoteMatcher();
  const twitchClipsMeiliSearchIndex = twitchClipsMeiliSearch?.getOrCreateIndex(guildId);

  return new Guild(
    guildId,
    broadcasterName,
    await twitchClipsMeiliSearchIndex,
    await emoteMatcher,
    await personalEmoteMatcherConstructor,
    settingsPermittedRoleIds,
    addEmotePermittedRoleIds,
    addEmotePermitNoRole
  );
}
