/** @format */

// Copyright (c) 2026 Tresster. All rights reserved. Licensed under the MIT license.
// See LICENSE.txt in the project root for license information.

/**
 * Search emotes, clips, use zero-width emotes and other such commands.
 *
 * @remarks
 * Initializes the {@link Bot} object, registers its handlers, and starts it.
 *
 * @packageDocumentation
 */

import { readdir, rm } from 'node:fs/promises';
import { scheduleJob } from 'node-schedule';
import { join } from 'node:path';
import { ensureDir, type Dirent } from 'fs-extra';

import { GoogleGenAI } from '@google/genai';
import { MeiliSearch } from 'meilisearch';
import { Translator } from 'deepl-node';
import OpenAI from 'openai';
import { Client, GatewayIntentBits } from 'discord.js';
import { getVoiceConnections } from '@discordjs/voice';
import initSqlJs from 'sql.js';

import { BroadcasterNameAndPersonalEmoteSetsDatabase } from './api/broadcaster-name-and-personal-emote-sets-database.ts';
import { PermittedRoleIdsDatabase } from './api/permitted-role-ids-database.ts';
import { AddedEmotesDatabase } from './api/added-emotes-database.ts';
import { MediaDatabase } from './api/media-database.ts';
import { PingsDatabase } from './api/ping-database.ts';
import { CachedUrl } from './api/cached-url.ts';
import { UsersDatabase } from './api/user.ts';
import { newTwitchApi } from './utils/constructors/new-twitch-api.ts';
import { newRedditApi } from './utils/constructors/new-reddit-api.ts';
import { newGuild } from './utils/constructors/new-guild.ts';
import { registerPings } from './utils/register-pings.ts';
import { DATABASE_DIR, DATABASE_ENDPOINTS, TMP_DIR } from './paths-and-endpoints.ts';
import { GlobalEmoteMatcherConstructor } from './emote-matcher-constructor.ts';
import { TwitchClipsMeiliSearch } from './twitch-clips-meili-search.ts';
import type { ReadonlyOpenAI, ReadonlyTranslator } from './types.ts';
import type { PersonalEmoteSets } from './personal-emote-sets.ts';
import { updateCommands } from './update-commands-docker.ts';
import type { Guild } from './guild.ts';
import { User } from './user.js';
import { Bot } from './bot.ts';

/**
 * Ensures that directories exist.
 *
 * @remarks
 *
 * Deletes everything in the {@link TMP_DIR} directory, but not the directory itself.
 */
const ensureDirs = (async (): Promise<void> => {
  await ensureDir(DATABASE_DIR);
  await ensureDir(TMP_DIR);

  await Promise.all(
    (await readdir(TMP_DIR, { withFileTypes: true }))
      .filter((dirent: Readonly<Dirent>) => dirent.isDirectory())
      .map((dirent: Readonly<Dirent>) => dirent.name)
      .map(async (dir) => rm(join(TMP_DIR, dir), { recursive: true }))
  );
})();

const updateCommands_ = (async (): Promise<void> => {
  if (process.argv.length < 3) {
    console.log('No commands lock file provided, skipping commands update.');
    return;
  }

  await updateCommands(process.argv[2]);
})();

/**
 * The central {@link Bot} object.
 *
 * @remarks
 *
 * Gets the environmental variables and constructs each object based on them.
 */
const bot = await (async (): Promise<Readonly<Bot>> => {
  const {
    OPENAI_API_KEY,
    DEEPL_API_KEY,
    TWITCH_CLIENT_ID,
    TWITCH_SECRET,
    REDDIT_CLIENT_ID,
    REDDIT_SECRET,
    MEILISEARCH_HOST,
    MEILISEARCH_API_KEY,
    LOCAL_CACHE_BASE,
    GEMINI_API_KEY
  } = process.env;

  const client: Client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
  });

  const openai: ReadonlyOpenAI | undefined =
    OPENAI_API_KEY !== undefined ? new OpenAI({ apiKey: OPENAI_API_KEY }) : undefined;

  const googleGenAI = GEMINI_API_KEY !== undefined ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : undefined;

  const translator: ReadonlyTranslator | undefined =
    DEEPL_API_KEY !== undefined ? new Translator(DEEPL_API_KEY) : undefined;

  const twitchApi =
    TWITCH_CLIENT_ID !== undefined && TWITCH_SECRET !== undefined
      ? newTwitchApi(TWITCH_CLIENT_ID, TWITCH_SECRET)
      : undefined;

  const redditApi =
    REDDIT_CLIENT_ID !== undefined && REDDIT_SECRET !== undefined
      ? newRedditApi(REDDIT_CLIENT_ID, REDDIT_SECRET)
      : undefined;

  const twitchClipsMeiliSearch: Readonly<TwitchClipsMeiliSearch> | undefined =
    MEILISEARCH_HOST !== undefined && MEILISEARCH_API_KEY !== undefined
      ? new TwitchClipsMeiliSearch(new MeiliSearch({ host: MEILISEARCH_HOST, apiKey: MEILISEARCH_API_KEY }))
      : undefined;

  const sqlJsStatic = await initSqlJs();
  const addedEmotesDatabase: Readonly<AddedEmotesDatabase> = new AddedEmotesDatabase(
    DATABASE_ENDPOINTS.addedEmotes,
    sqlJsStatic
  );
  const pingsDatabase: Readonly<PingsDatabase> = new PingsDatabase(DATABASE_ENDPOINTS.pings, sqlJsStatic);
  const permittedRoleIdsDatabase: Readonly<PermittedRoleIdsDatabase> = new PermittedRoleIdsDatabase(
    DATABASE_ENDPOINTS.permitRoleIds,
    sqlJsStatic
  );
  const broadcasterNameAndPersonalEmoteSetsDatabase: Readonly<BroadcasterNameAndPersonalEmoteSetsDatabase> =
    new BroadcasterNameAndPersonalEmoteSetsDatabase(
      DATABASE_ENDPOINTS.broadcasterNameAndPersonalEmoteSets,
      sqlJsStatic
    );
  const usersDatabase: Readonly<UsersDatabase> = new UsersDatabase(DATABASE_ENDPOINTS.users, sqlJsStatic);
  const mediaDatabase: Readonly<MediaDatabase> = new MediaDatabase(DATABASE_ENDPOINTS.media, sqlJsStatic);

  const cachedUrl: Readonly<CachedUrl> = new CachedUrl(LOCAL_CACHE_BASE);

  await GlobalEmoteMatcherConstructor.createInstance(await twitchApi, addedEmotesDatabase);

  const guilds: readonly Readonly<Guild>[] = await Promise.all(
    broadcasterNameAndPersonalEmoteSetsDatabase
      .getAllBroadcasterNamesAndPersonalEmoteSets()
      .entries()
      .toArray()
      .map(
        async ([guildId, [broadcasterName, personalEmoteSets]]: readonly [
          string,
          readonly [string | null, PersonalEmoteSets]
        ]) => {
          return newGuild(
            guildId,
            twitchClipsMeiliSearch,
            addedEmotesDatabase,
            permittedRoleIdsDatabase,
            broadcasterName,
            personalEmoteSets
          );
        }
      )
  );

  const users: readonly Readonly<User>[] = usersDatabase
    .getAllUsers()
    .entries()
    .toArray()
    .map(([userId, [guildId]]: readonly [string, readonly [string]]) => {
      const guild = guilds.find((guild_) => guild_.id === guildId);
      if (guild === undefined) throw new Error('Undefined guild while searching for guild for user.');

      return new User(userId, guild);
    });

  return new Bot(
    client,
    openai,
    googleGenAI,
    translator,
    await twitchApi,
    await redditApi,
    addedEmotesDatabase,
    pingsDatabase,
    permittedRoleIdsDatabase,
    broadcasterNameAndPersonalEmoteSetsDatabase,
    usersDatabase,
    mediaDatabase,
    cachedUrl,
    guilds,
    users,
    twitchClipsMeiliSearch
  );
})();

/**
 * Closes each database and other shutdown functionalities.
 */
function closeFunction(): void {
  try {
    bot.addedEmotesDatabase.close();
    bot.pingsDatabase.close();
    bot.permittedRoleIdsDatabase.close();
    bot.broadcasterNameAndPersonalEmoteSetsDatabase.close();
    bot.usersDatabase.close();
    bot.mediaDatabase.close();
  } catch (error) {
    console.log(
      `Error at closeFunction - closing databases: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  try {
    const { user } = bot.client;
    if (user === null) return;

    user.setStatus('invisible');
  } catch (error) {
    console.log(
      `Error at closeFunction - setting invisible status: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  try {
    getVoiceConnections().forEach((connection) => {
      connection.destroy();
    });
  } catch (error) {
    console.log(
      `Error at closeFunction - destroying voice connections: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

process.on('exit', (): void => {
  console.log('exiting');
  closeFunction();
});

process.on('SIGINT', (): void => {
  console.log('received SIGINT');
  closeFunction();
});

process.on('SIGTERM', (): void => {
  console.log('received SIGTERM');
  closeFunction();
});

process.on('uncaughtException', (error: Readonly<Error>): void => {
  console.log(`uncaughtException: ${error.message}`);
});

process.on('unhandledRejection', (error): void => {
  console.log(`unhandledRejection: ${error instanceof Error ? error.message : String(error)}`);
});

const refreshClipsOrRefreshUniqueCreatorNamesAndGameIds: readonly Promise<void>[] =
  process.env['UPDATE_CLIPS_ON_STARTUP'] === 'true'
    ? bot.guilds.map(async (guild) => guild.refreshClips(bot.twitchApi))
    : bot.guilds.map(async (guild) => guild.refreshUniqueCreatorNamesAndGameIds());

scheduleJob('0 */4 * * * *', () => {
  bot.cleanupMessageBuilders();
});

scheduleJob('0 */20 * * * *', async () => {
  await Promise.all(bot.guilds.map(async (guild) => guild.refreshEmoteMatcher()));
});

// update every hour, in the 54th minute 0th second
// this is because of the 300 second timeout of fetch + 1 minute, so twitch api is validated before use
scheduleJob('0 54 * * * *', async () => {
  await bot.twitchApi?.validateAndGetNewAccessTokenIfInvalid();
});
scheduleJob('0 54 * * * *', async () => {
  await bot.redditApi?.validateAndGetNewAccessTokenIfInvalid();
});

scheduleJob('0 */2 * * *', async () => {
  await Promise.all(bot.guilds.map(async (guild) => guild.refreshClips(bot.twitchApi)));
});

scheduleJob('6 */6 * * *', async () => {
  await Promise.all(
    bot.guilds.map(async (guild) => guild.personalEmoteMatcherConstructor.refreshBTTVAndFFZPersonalEmotes())
  );
});

scheduleJob('12 */12 * * *', async () => {
  await GlobalEmoteMatcherConstructor.instance.refreshGlobalEmotes();
});

bot.registerHandlers();
await ensureDirs;
await updateCommands_;
await Promise.all(refreshClipsOrRefreshUniqueCreatorNamesAndGameIds);
await bot.start(process.env['DISCORD_TOKEN']);
await registerPings(bot.client, bot.pingsDatabase, bot.scheduledJobs);
