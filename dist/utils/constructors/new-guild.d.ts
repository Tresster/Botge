/** @format */
import { Guild } from '../../guild.ts';
import type { PersonalEmoteSets } from '../../personal-emote-sets.ts';
import type { TwitchClipsMeiliSearch } from '../../twitch-clips-meili-search.ts';
import type { AddedEmotesDatabase } from '../../api/added-emotes-database.ts';
import type { PermittedRoleIdsDatabase } from '../../api/permitted-role-ids-database.ts';
export declare function newGuild(
  guildId: string,
  twitchClipsMeiliSearch: Readonly<TwitchClipsMeiliSearch> | undefined,
  addedEmotesDatabase: Readonly<AddedEmotesDatabase>,
  permittedRoleIdsDatabase: Readonly<PermittedRoleIdsDatabase>,
  broadcasterName: string | null,
  personalEmoteSets: PersonalEmoteSets | undefined
): Promise<Readonly<Guild>>;
