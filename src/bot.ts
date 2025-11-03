/** @format */

import type { Job } from 'node-schedule';

import { Events, type ChatInputCommandInteraction, type Client } from 'discord.js';
import { joinVoiceChannel } from '@discordjs/voice';

import { newGuild } from './utils/constructors/new-guild.ts';
import { shortestUniqueSubstringsHandler } from './command-handlers/shortest-unique-substrings.ts';
import { emoteHandler, emotesHandler, emoteListHandler } from './command-handlers/emote.ts';
import { addEmoteHandlerSevenTVNotInSet } from './command-handlers/add-emote.ts';
import { findTheEmojiHandler } from './command-handlers/find-the-emoji.ts';
import { mediaListHandler } from './command-handlers/media-list.ts';
import { translateHandler } from './command-handlers/translate.ts';
import { transientHandler } from './command-handlers/transient.ts';
import { pingListHandler } from './command-handlers/ping-list.ts';
import { settingsHandler } from './command-handlers/settings.ts';
import { chatgptHandler } from './command-handlers/openai.ts';
import { geminiHandler } from './command-handlers/gemini.ts';
import { pingMeHandler } from './command-handlers/pingme.ts';
import { steamHandler } from './command-handlers/steam.ts';
import { mediaHandler } from './command-handlers/media.ts';
import { dramaHandler } from './command-handlers/drama.ts';
import { clipHandler } from './command-handlers/clip.ts';
import type { BroadcasterNameAndPersonalEmoteSetsDatabase } from './api/broadcaster-name-and-personal-emote-sets-database.ts';
import type { PermittedRoleIdsDatabase } from './api/permitted-role-ids-database.ts';
import type { AddedEmotesDatabase } from './api/added-emotes-database.ts';
import type { MediaDatabase } from './api/media-database.ts';
import type { PingsDatabase } from './api/ping-database.ts';
import type { TwitchApi } from './api/twitch-api.ts';
import type { RedditApi } from './api/reddit-api.ts';
import type { CachedUrl } from './api/cached-url.ts';
import type { UsersDatabase } from './api/user.ts';
import { messageContextMenuCommandHandler } from './interaction-handlers/message-context-menu-command.ts';
import { roleSelectMenuHandler } from './interaction-handlers/role-select-menu.ts';
import { autocompleteHandler } from './interaction-handlers/autocomplete.ts';
import { modalSubmitHandler } from './interaction-handlers/modal-submit.ts';
import { buttonHandler } from './interaction-handlers/button.ts';
import type { TwitchClipMessageBuilder } from './message-builders/twitch-clip-message-builder.ts';
import type { EmoteMessageBuilder } from './message-builders/emote-message-builder.ts';
import type { PingForPingListMessageBuilder } from './message-builders/ping-for-ping-list-message-builder.ts';
import type { PingForPingMeMessageBuilder } from './message-builders/ping-for-ping-me-message-builder.ts';
import type { MediaMessageBuilder } from './message-builders/media-message-builder.ts';
import { messageCreateHandler } from './message-create-handlers/message-create-handler.ts';
import type { ReadonlyGoogleGenAI, ReadonlyOpenAI, ReadonlyTranslator } from './types.ts';
import type { TwitchClipsMeiliSearch } from './twitch-clips-meili-search.ts';
import { GENERAL_CHANNEL_ID_CUTEDOG } from './guilds.ts';
import { SLASH_COMMAND_NAMES } from './commands.ts';
import type { Guild } from './guild.ts';
import type { User } from './user.ts';

const CLEANUP_MINUTES = 10 as const;

export class Bot {
  readonly #client: Client;
  readonly #openai: ReadonlyOpenAI | undefined;
  readonly #googleGenAI: ReadonlyGoogleGenAI | undefined;
  readonly #translator: ReadonlyTranslator | undefined;
  readonly #twitchApi: Readonly<TwitchApi> | undefined;
  readonly #redditApi: Readonly<RedditApi> | undefined;
  readonly #addedEmotesDatabase: Readonly<AddedEmotesDatabase>;
  readonly #pingsDatabase: Readonly<PingsDatabase>;
  readonly #permittedRoleIdsDatabase: Readonly<PermittedRoleIdsDatabase>;
  readonly #broadcasterNameAndPersonalEmoteSetsDatabase: Readonly<BroadcasterNameAndPersonalEmoteSetsDatabase>;
  readonly #usersDatabase: Readonly<UsersDatabase>;
  readonly #mediaDatabase: Readonly<MediaDatabase>;
  readonly #cachedUrl: Readonly<CachedUrl>;
  readonly #guilds: Readonly<Guild>[];
  readonly #users: Readonly<User>[];
  readonly #twitchClipMessageBuilders: TwitchClipMessageBuilder[] = [];
  readonly #emoteMessageBuilders: EmoteMessageBuilder[] = [];
  readonly #pingForPingMeMessageBuilders: PingForPingMeMessageBuilder[] = [];
  readonly #pingForPingListMessageBuilders: PingForPingListMessageBuilder[] = [];
  readonly #mediaMessageBuilders: MediaMessageBuilder[] = [];
  readonly #twitchClipsMeiliSearch: Readonly<TwitchClipsMeiliSearch> | undefined;
  readonly #commandHandlers: Map<
    string,
    (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>) => Promise<void>
  >;
  readonly #scheduledJobs: Readonly<Job>[] = [];

  public constructor(
    client: Client,
    openai: ReadonlyOpenAI | undefined,
    googleGenAI: ReadonlyGoogleGenAI | undefined,
    translator: ReadonlyTranslator | undefined,
    twitchApi: Readonly<TwitchApi> | undefined,
    redditApi: Readonly<RedditApi> | undefined,
    addedEmotesDatabase: Readonly<AddedEmotesDatabase>,
    pingsDatabase: Readonly<PingsDatabase>,
    permittedRoleIdsDatabase: Readonly<PermittedRoleIdsDatabase>,
    broadcasterNameAndPersonalEmoteSetsDatabase: Readonly<BroadcasterNameAndPersonalEmoteSetsDatabase>,
    usersDatabase: Readonly<UsersDatabase>,
    mediaDatabase: Readonly<MediaDatabase>,
    cachedUrl: Readonly<CachedUrl>,
    guilds: readonly Readonly<Guild>[],
    users: readonly Readonly<User>[],
    twitchClipsMeiliSearch: Readonly<TwitchClipsMeiliSearch> | undefined
  ) {
    this.#client = client;
    this.#openai = openai;
    this.#googleGenAI = googleGenAI;
    this.#translator = translator;
    this.#twitchApi = twitchApi;
    this.#redditApi = redditApi;
    this.#addedEmotesDatabase = addedEmotesDatabase;
    this.#pingsDatabase = pingsDatabase;
    this.#permittedRoleIdsDatabase = permittedRoleIdsDatabase;
    this.#broadcasterNameAndPersonalEmoteSetsDatabase = broadcasterNameAndPersonalEmoteSetsDatabase;
    this.#usersDatabase = usersDatabase;
    this.#mediaDatabase = mediaDatabase;
    this.#cachedUrl = cachedUrl;
    this.#guilds = [...guilds];
    this.#users = [...users];
    this.#twitchClipsMeiliSearch = twitchClipsMeiliSearch;
    this.#commandHandlers = new Map<
      string,
      (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>) => Promise<void>
    >([
      [SLASH_COMMAND_NAMES.emote, emoteHandler()],
      [SLASH_COMMAND_NAMES.emoteList, emoteListHandler(this.#emoteMessageBuilders)],
      [SLASH_COMMAND_NAMES.gemini, geminiHandler(this.#googleGenAI)],
      [SLASH_COMMAND_NAMES.clip, clipHandler(this.#twitchClipMessageBuilders)],
      [SLASH_COMMAND_NAMES.addEmote, addEmoteHandlerSevenTVNotInSet(this.#addedEmotesDatabase)],
      [SLASH_COMMAND_NAMES.shortestUniqueSubstrings, shortestUniqueSubstringsHandler(this.#emoteMessageBuilders)],
      [SLASH_COMMAND_NAMES.chatGpt, chatgptHandler(this.#openai)],
      [SLASH_COMMAND_NAMES.translate, translateHandler(this.#translator)],
      [SLASH_COMMAND_NAMES.transient, transientHandler()],
      [SLASH_COMMAND_NAMES.findTheEmoji, findTheEmojiHandler()],
      [
        SLASH_COMMAND_NAMES.pingMe,
        pingMeHandler(this.#pingsDatabase, this.#pingForPingMeMessageBuilders, this.#client, this.#scheduledJobs)
      ],
      [SLASH_COMMAND_NAMES.poe2, steamHandler('2694490')],
      [
        SLASH_COMMAND_NAMES.pingList,
        pingListHandler(this.#pingsDatabase, this.#pingForPingListMessageBuilders, this.#client, this.#scheduledJobs)
      ],
      [SLASH_COMMAND_NAMES.media, mediaHandler(this.#mediaDatabase)],
      [SLASH_COMMAND_NAMES.mediaList, mediaListHandler(this.#mediaDatabase, this.#mediaMessageBuilders)],
      [SLASH_COMMAND_NAMES.drama, dramaHandler(this.#redditApi)]
    ]);
  }

  public get client(): Client {
    return this.#client;
  }
  public get guilds(): readonly Readonly<Guild>[] {
    return this.#guilds;
  }
  public get twitchApi(): Readonly<TwitchApi> | undefined {
    return this.#twitchApi;
  }
  public get redditApi(): Readonly<RedditApi> | undefined {
    return this.#redditApi;
  }
  public get addedEmotesDatabase(): Readonly<AddedEmotesDatabase> {
    return this.#addedEmotesDatabase;
  }
  public get pingsDatabase(): Readonly<PingsDatabase> {
    return this.#pingsDatabase;
  }
  public get permittedRoleIdsDatabase(): Readonly<PermittedRoleIdsDatabase> {
    return this.#permittedRoleIdsDatabase;
  }
  public get broadcasterNameAndPersonalEmoteSetsDatabase(): Readonly<BroadcasterNameAndPersonalEmoteSetsDatabase> {
    return this.#broadcasterNameAndPersonalEmoteSetsDatabase;
  }
  public get usersDatabase(): Readonly<UsersDatabase> {
    return this.#usersDatabase;
  }
  public get mediaDatabase(): Readonly<MediaDatabase> {
    return this.#mediaDatabase;
  }
  public get scheduledJobs(): Readonly<Job>[] {
    return this.#scheduledJobs;
  }

  public registerHandlers(): void {
    this.#client.on(Events.ClientReady, (): void => {
      const { user, channels } = this.#client;
      if (user === null) throw new Error('Bot client user is empty.');

      user.setStatus('online');
      user.setActivity('💟 botge.gitbook.io');

      try {
        const { JOIN_VOICE_CHANNEL } = process.env;

        if (JOIN_VOICE_CHANNEL === 'true') {
          const cuteDogGeneralChannel = channels.cache.find((channel) => channel.id === GENERAL_CHANNEL_ID_CUTEDOG);

          if (
            cuteDogGeneralChannel !== undefined &&
            cuteDogGeneralChannel.isVoiceBased() &&
            cuteDogGeneralChannel.joinable
          ) {
            joinVoiceChannel({
              channelId: cuteDogGeneralChannel.id,
              guildId: cuteDogGeneralChannel.guild.id,
              adapterCreator: cuteDogGeneralChannel.guild.voiceAdapterCreator,
              selfDeaf: true,
              selfMute: true
            });
          }
        }
      } catch (error) {
        console.log(`Error at joining voice channel --> ${error instanceof Error ? error.message : String(error)}`);
      }

      console.log(`Logged in as ${user.tag}!`);
    });

    this.#client.on(Events.MessageCreate, async (message): Promise<void> => {
      const { guildId } = message;
      if (guildId === null || message.author.bot) return;

      const guild =
        this.#guilds.find((guild_) => guild_.id === guildId) ??
        (await (async (): Promise<Readonly<Guild>> => {
          const newGuildWithoutPersonalEmotes_ = await newGuild(
            guildId,
            this.#twitchClipsMeiliSearch,
            this.#addedEmotesDatabase,
            this.#permittedRoleIdsDatabase,
            null,
            undefined
          );
          this.#guilds.push(newGuildWithoutPersonalEmotes_);

          return newGuildWithoutPersonalEmotes_;
        })());

      void messageCreateHandler()(this.#cachedUrl, message, guild, this.#mediaDatabase);
    });

    //interaction
    this.#client.on(Events.InteractionCreate, async (interaction): Promise<void> => {
      //interaction not
      if (
        !interaction.isChatInputCommand() &&
        !interaction.isButton() &&
        !interaction.isAutocomplete() &&
        !interaction.isModalSubmit() &&
        !interaction.isRoleSelectMenu() &&
        !interaction.isMessageContextMenuCommand()
      )
        return;

      const { guildId, user } = interaction;
      if (user.bot) return;

      const guild = await (async (): Promise<Readonly<Guild> | undefined> => {
        if (guildId !== null) {
          const guild_ =
            this.#guilds.find((guildge) => guildge.id === guildId) ??
            (await (async (): Promise<Readonly<Guild>> => {
              const newGuildWithoutPersonalEmotes_ = await newGuild(
                guildId,
                this.#twitchClipsMeiliSearch,
                this.#addedEmotesDatabase,
                this.#permittedRoleIdsDatabase,
                null,
                undefined
              );
              this.#guilds.push(newGuildWithoutPersonalEmotes_);

              return newGuildWithoutPersonalEmotes_;
            })());

          return guild_;
        }

        const guildId_ = ((): string | undefined => {
          const user_ = this.#users.find((userge) => userge.id === interaction.user.id);
          if (user_ === undefined) return undefined;
          return user_.guild.id;
        })();
        if (guildId_ === undefined) return undefined;
        const guild_ = this.#guilds.find((guildge) => guildge.id === guildId_);
        //there cannot be a case when we found a guildId from a user and we would need to create a guild without personal emotes
        if (guild_ === undefined) throw new Error("Couldn't find guild.");
        return guild_;
      })();

      if (interaction.isModalSubmit()) {
        void modalSubmitHandler(
          this.#twitchClipMessageBuilders,
          this.#emoteMessageBuilders,
          this.#pingForPingListMessageBuilders,
          this.#mediaMessageBuilders,
          guild,
          this.#broadcasterNameAndPersonalEmoteSetsDatabase,
          this.#usersDatabase,
          this.#twitchApi,
          this.#guilds,
          this.#users
        )(interaction);
        return;
      }

      if (interaction.isAutocomplete()) {
        if (guild === undefined) return;
        const { emoteMatcher, twitchClipsMeiliSearchIndex, uniqueCreatorNames, uniqueGameIds } = guild;

        void autocompleteHandler(
          emoteMatcher,
          twitchClipsMeiliSearchIndex,
          uniqueCreatorNames,
          uniqueGameIds,
          this.#mediaDatabase
        )(interaction);
        return;
      }

      if (interaction.isRoleSelectMenu()) {
        if (guild === undefined) return;
        void roleSelectMenuHandler(guild, this.#permittedRoleIdsDatabase)(interaction);
        return;
      }

      if (interaction.isButton()) {
        const user_ = this.#users.find((userge) => userge.id === interaction.user.id);

        const emoteMessageBuilder = await buttonHandler(
          this.#twitchClipMessageBuilders,
          this.#emoteMessageBuilders,
          this.#mediaMessageBuilders,
          this.#pingForPingMeMessageBuilders,
          this.#pingForPingListMessageBuilders,
          guild,
          user_,
          this.#addedEmotesDatabase,
          this.#permittedRoleIdsDatabase,
          this.#pingsDatabase,
          this.#mediaDatabase
        )(interaction);

        if (emoteMessageBuilder !== undefined) this.#emoteMessageBuilders.push(emoteMessageBuilder);
        return;
      }

      if (interaction.isMessageContextMenuCommand()) {
        void messageContextMenuCommandHandler(this.#openai, this.#mediaDatabase)(interaction);
        return;
      }

      if (interaction.commandName === SLASH_COMMAND_NAMES.settings) {
        void settingsHandler()(interaction, guild);
        return;
      }

      if (guild === undefined) return;

      if (interaction.commandName === SLASH_COMMAND_NAMES.emotes) {
        void emotesHandler(this.#cachedUrl)(guild, interaction);
        return;
      }

      const commandHandler = this.#commandHandlers.get(interaction.commandName);
      if (commandHandler === undefined) return;
      void commandHandler(interaction, guild);
      // TODO: error handling

      return;
    });
  }

  public cleanupMessageBuilders(): void {
    const timeNow = Date.now();

    this.#cleanupMessageBuilders(this.#twitchClipMessageBuilders, timeNow);
    this.#cleanupMessageBuilders(this.#emoteMessageBuilders, timeNow);
    this.#cleanupMessageBuilders(this.#pingForPingListMessageBuilders, timeNow);
    this.#cleanupMessageBuilders(this.#mediaMessageBuilders, timeNow);
    this.#cleanupPingMessageBuilders(timeNow);
  }

  public async start(discordToken: string | undefined): Promise<void> {
    await this.#client.login(discordToken);
  }

  #cleanupMessageBuilders(
    messageBuilders: (
      | TwitchClipMessageBuilder
      | EmoteMessageBuilder
      | PingForPingListMessageBuilder
      | MediaMessageBuilder
    )[],
    timeNow: number
  ): void {
    for (const [index, messageBuilder] of messageBuilders.entries()) {
      const difference = timeNow - messageBuilder.interaction.createdAt.getTime();

      if (difference > CLEANUP_MINUTES * 60000) {
        messageBuilders.splice(index, 1);
        this.#cleanupMessageBuilders(messageBuilders, timeNow);
        return;
      }
    }
  }

  #cleanupPingMessageBuilders(timeNow: number): void {
    for (const [index, pingMessageBuilder] of this.#pingForPingMeMessageBuilders.entries()) {
      const difference = timeNow - pingMessageBuilder.interaction.createdAt.getTime();

      if (difference > CLEANUP_MINUTES * 60000) {
        pingMessageBuilder.cleanupPressedMapsJob.cancel();
        this.#pingForPingMeMessageBuilders.splice(index, 1);
        this.#cleanupPingMessageBuilders(timeNow);
        return;
      }
    }
  }
}
