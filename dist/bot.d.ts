/** @format */
import type { Job } from 'node-schedule';
import { type Client } from 'discord.js';
import type { BroadcasterNameAndPersonalEmoteSetsDatabase } from './api/broadcaster-name-and-personal-emote-sets-database.ts';
import type { PermittedRoleIdsDatabase } from './api/permitted-role-ids-database.ts';
import type { AddedEmotesDatabase } from './api/added-emotes-database.ts';
import type { PingsDatabase } from './api/ping-database.ts';
import type { TwitchApi } from './api/twitch-api.ts';
import type { CachedUrl } from './api/cached-url.ts';
import type { UsersDatabase } from './api/user.ts';
import type { ReadonlyGoogleGenAI, ReadonlyOpenAI, ReadonlyTranslator } from './types.ts';
import type { TwitchClipsMeiliSearch } from './twitch-clips-meili-search.ts';
import type { Guild } from './guild.ts';
import type { User } from './user.ts';
export declare class Bot {
  #private;
  constructor(
    client: Client,
    openai: ReadonlyOpenAI | undefined,
    googleGenAI: ReadonlyGoogleGenAI | undefined,
    translator: ReadonlyTranslator | undefined,
    twitchApi: Readonly<TwitchApi> | undefined,
    addedEmotesDatabase: Readonly<AddedEmotesDatabase>,
    pingsDatabase: Readonly<PingsDatabase>,
    permittedRoleIdsDatabase: Readonly<PermittedRoleIdsDatabase>,
    broadcasterNameAndPersonalEmoteSetsDatabase: Readonly<BroadcasterNameAndPersonalEmoteSetsDatabase>,
    usersDatabase: Readonly<UsersDatabase>,
    cachedUrl: Readonly<CachedUrl>,
    guilds: readonly Readonly<Guild>[],
    users: readonly Readonly<User>[],
    twitchClipsMeiliSearch: Readonly<TwitchClipsMeiliSearch> | undefined
  );
  get client(): Client;
  get guilds(): readonly Readonly<Guild>[];
  get twitchApi(): Readonly<TwitchApi> | undefined;
  get addedEmotesDatabase(): Readonly<AddedEmotesDatabase>;
  get pingsDatabase(): Readonly<PingsDatabase>;
  get permittedRoleIdsDatabase(): Readonly<PermittedRoleIdsDatabase>;
  get broadcasterNameAndPersonalEmoteSetsDatabase(): Readonly<BroadcasterNameAndPersonalEmoteSetsDatabase>;
  get usersDatabase(): Readonly<UsersDatabase>;
  get scheduledJobs(): Readonly<Job>[];
  registerHandlers(): void;
  cleanupMessageBuilders(): void;
  start(discordToken: string | undefined): Promise<void>;
}
