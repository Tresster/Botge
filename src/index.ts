import { ensureDir, type Dirent } from 'fs-extra';
import { readdir, rm } from 'node:fs/promises';
import { scheduleJob } from 'node-schedule';
import { GoogleGenAI } from '@google/genai';
import { MeiliSearch } from 'meilisearch';
import { Translator } from 'deepl-node';
import { join } from 'node:path';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { Client, GatewayIntentBits } from 'discord.js';

import { BroadcasterNameAndPersonalEmoteSetsDatabase } from './api/broadcaster-name-and-personal-emote-sets-database.js';
import { PermittedRoleIdsDatabase } from './api/permitted-role-ids-database.js';
import { AddedEmotesDatabase } from './api/added-emotes-database.js';
import { PingsDatabase } from './api/ping-database.js';
import { CachedUrl } from './api/cached-url.js';
import { newTwitchApi } from './utils/constructors/new-twitch-api.js';
import { newGuild } from './utils/constructors/new-guild.js';
import { registerPings } from './utils/register-pings.js';
import { DATABASE_DIR, DATABASE_ENDPOINTS, TMP_DIR } from './paths-and-endpoints.js';
import { GlobalEmoteMatcherConstructor } from './emote-matcher-constructor.js';
import { TwitchClipsMeiliSearch } from './twitch-clips-meili-search.js';
import type { ReadonlyOpenAI, ReadonlyTranslator } from './types.js';
import type { PersonalEmoteSets } from './personal-emote-sets.js';
import { updateCommands } from './update-commands-docker.js';
import type { Guild } from './guild.js';
import { Bot } from './bot.js';

dotenv.config();
const {
  DISCORD_TOKEN,
  OPENAI_API_KEY,
  DEEPL_API_KEY,
  TWITCH_CLIENT_ID,
  TWITCH_SECRET,
  MEILISEARCH_HOST,
  MEILISEARCH_API_KEY,
  LOCAL_CACHE_BASE,
  UPDATE_CLIPS_ON_STARTUP,
  GEMINI_API_KEY
} = process.env;

async function ensureDirTmp(): Promise<void> {
  await ensureDir(TMP_DIR);
  //delete everything in the tmp directory, if temp files got stuck. but not the tmp directory itself
  (await readdir(TMP_DIR, { withFileTypes: true }))
    .filter((dirent: Readonly<Dirent>) => dirent.isDirectory())
    .map((dirent: Readonly<Dirent>) => dirent.name)
    .forEach((dir) => void rm(join(TMP_DIR, dir), { recursive: true }));
}

const ensureDirTmp_ = ensureDirTmp();
await ensureDir(DATABASE_DIR);

const commandUpdate = (async function (): Promise<void> {
  if (process.argv.length < 3) {
    console.log('No commands lock file provided, skipping commands update.');
    return;
  }

  await updateCommands(process.argv[2]);
})();

const bot = await (async (): Promise<Readonly<Bot>> => {
  const client: Client = new Client({ intents: [GatewayIntentBits.Guilds] });

  const openai: ReadonlyOpenAI | undefined =
    OPENAI_API_KEY !== undefined ? new OpenAI({ apiKey: OPENAI_API_KEY }) : undefined;

  const googleGenAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const translator: ReadonlyTranslator | undefined =
    DEEPL_API_KEY !== undefined ? new Translator(DEEPL_API_KEY) : undefined;

  const twitchApi =
    TWITCH_CLIENT_ID !== undefined && TWITCH_SECRET !== undefined
      ? newTwitchApi(TWITCH_CLIENT_ID, TWITCH_SECRET)
      : undefined;

  const twitchClipsMeiliSearch: Readonly<TwitchClipsMeiliSearch> | undefined =
    MEILISEARCH_HOST !== undefined && MEILISEARCH_API_KEY !== undefined
      ? new TwitchClipsMeiliSearch(new MeiliSearch({ host: MEILISEARCH_HOST, apiKey: MEILISEARCH_API_KEY }))
      : undefined;

  const addedEmotesDatabase: Readonly<AddedEmotesDatabase> = new AddedEmotesDatabase(DATABASE_ENDPOINTS.addedEmotes);
  const pingsDatabase: Readonly<PingsDatabase> = new PingsDatabase(DATABASE_ENDPOINTS.pings);
  const permittedRoleIdsDatabase: Readonly<PermittedRoleIdsDatabase> = new PermittedRoleIdsDatabase(
    DATABASE_ENDPOINTS.permitRoleIds
  );
  const broadcasterNameAndPersonalEmoteSetsDatabase: Readonly<BroadcasterNameAndPersonalEmoteSetsDatabase> =
    new BroadcasterNameAndPersonalEmoteSetsDatabase(DATABASE_ENDPOINTS.broadcasterNameAndpersonalEmoteSets);

  const cachedUrl: Readonly<CachedUrl> = new CachedUrl(LOCAL_CACHE_BASE);

  await GlobalEmoteMatcherConstructor.createInstance(await twitchApi, addedEmotesDatabase);

  const guilds: readonly Promise<Readonly<Guild>>[] = broadcasterNameAndPersonalEmoteSetsDatabase
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
    );

  return new Bot(
    client,
    openai,
    googleGenAI,
    translator,
    await twitchApi,
    addedEmotesDatabase,
    pingsDatabase,
    permittedRoleIdsDatabase,
    broadcasterNameAndPersonalEmoteSetsDatabase,
    cachedUrl,
    await Promise.all(guilds),
    twitchClipsMeiliSearch
  );
})();

function closeFunction(): void {
  try {
    bot.addedEmotesDatabase.close();
    bot.pingsDatabase.close();
    bot.permittedRoleIdsDatabase.close();
    bot.broadcasterNameAndPersonalEmoteSetsDatabase.close();
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

let refreshClipsOrRefreshUniqueCreatorNamesAndGameIds: readonly Promise<void>[] = [];
if (UPDATE_CLIPS_ON_STARTUP === 'true') {
  refreshClipsOrRefreshUniqueCreatorNamesAndGameIds = bot.guilds.map(async (guild) =>
    guild.refreshClips(bot.twitchApi)
  );
} else {
  refreshClipsOrRefreshUniqueCreatorNamesAndGameIds = bot.guilds.map(async (guild) =>
    guild.refreshUniqueCreatorNamesAndGameIds()
  );
}

scheduleJob('0 */4 * * * *', () => {
  bot.cleanupMessageBuilders();
});

scheduleJob('0 */20 * * * *', async () => {
  await Promise.all(bot.guilds.map(async (guild) => guild.refreshEmoteMatcher()));
});

// update every hour, in the 54th minute 0th second
// this is because of the 300 second timeout of fetch + 1 minute, so twitch api is validated before use
scheduleJob('0 54 * * * *', async () => {
  await bot.twitchApi?.validateAccessToken();
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
await ensureDirTmp_;
await commandUpdate;
await Promise.all(refreshClipsOrRefreshUniqueCreatorNamesAndGameIds);
await bot.start(DISCORD_TOKEN);
await registerPings(bot.client, bot.pingsDatabase);
