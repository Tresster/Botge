import { type ChatInputCommandInteraction, Events, type Client } from 'discord.js';

import { newGuild } from './utils/constructors/new-guild.ts';
import { shortestuniquesubstringsHandler } from './command-handlers/shortest-unique-substrings.ts';
import { emoteHandler, emotesHandler, emoteListHandler } from './command-handlers/emote.ts';
import { addEmoteHandlerSevenTVNotInSet } from './command-handlers/add-emote.ts';
import { findTheEmojiHandler } from './command-handlers/find-the-emoji.ts';
import { translateHandler } from './command-handlers/translate.ts';
import { transientHandler } from './command-handlers/transient.ts';
import { settingsHandler } from './command-handlers/settings.ts';
import { chatgptHandler } from './command-handlers/openai.ts';
import { geminiHandler } from './command-handlers/gemini.ts';
import { pingMeHandler } from './command-handlers/pingme.ts';
import { steamHandler } from './command-handlers/steam.ts';
import { clipHandler } from './command-handlers/clip.ts';
import { bannedHandler } from './command-handlers/banned.ts';
import type { BroadcasterNameAndPersonalEmoteSetsDatabase } from './api/broadcaster-name-and-personal-emote-sets-database.ts';
import type { PermittedRoleIdsDatabase } from './api/permitted-role-ids-database.ts';
import type { AddedEmotesDatabase } from './api/added-emotes-database.ts';
import type { PingsDatabase } from './api/ping-database.ts';
import type { TwitchApi } from './api/twitch-api.ts';
import type { CachedUrl } from './api/cached-url.ts';
import { messageContextMenuCommandHandler } from './interaction-handlers/message-context-menu-command.ts';
import { roleSelectMenuHandler } from './interaction-handlers/role-select-menu.ts';
import { autocompleteHandler } from './interaction-handlers/autocomplete.ts';
import { modalSubmitHandler } from './interaction-handlers/modal-submit.ts';
import { buttonHandler } from './interaction-handlers/button.ts';
import type { TwitchClipMessageBuilder } from './message-builders/twitch-clip-message-builder.ts';
import type { EmoteMessageBuilder } from './message-builders/emote-message-builder.ts';
import type { PingMessageBuilder } from './message-builders/ping-message-builder.ts';
import { messageCreateHandler } from './message-create-handlers/message-create-handler.ts';
import type { ReadonlyGoogleGenAI, ReadonlyOpenAI, ReadonlyTranslator } from './types.ts';
import type { TwitchClipsMeiliSearch } from './twitch-clips-meili-search.ts';
import type { Guild } from './guild.ts';

const CLEANUP_MINUTES = 10;

export class Bot {
  readonly #client: Client;
  readonly #openai: ReadonlyOpenAI | undefined;
  readonly #googleGenAI: ReadonlyGoogleGenAI | undefined;
  readonly #translator: ReadonlyTranslator | undefined;
  readonly #twitchApi: Readonly<TwitchApi> | undefined;
  readonly #addedEmotesDatabase: Readonly<AddedEmotesDatabase>;
  readonly #pingsDatabase: Readonly<PingsDatabase>;
  readonly #permittedRoleIdsDatabase: Readonly<PermittedRoleIdsDatabase>;
  readonly #broadcasterNameAndPersonalEmoteSetsDatabase: Readonly<BroadcasterNameAndPersonalEmoteSetsDatabase>;
  readonly #cachedUrl: Readonly<CachedUrl>;
  readonly #guilds: Readonly<Guild>[];
  readonly #twitchClipMessageBuilders: TwitchClipMessageBuilder[] = [];
  readonly #emoteMessageBuilders: EmoteMessageBuilder[] = [];
  readonly #pingMessageBuilders: PingMessageBuilder[] = [];
  readonly #twitchClipsMeiliSearch: Readonly<TwitchClipsMeiliSearch> | undefined;
  readonly #commandHandlers: Map<
    string,
    (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>) => Promise<void>
  >;

  public constructor(
    client: Client,
    openai: ReadonlyOpenAI | undefined,
    googleGenAI: ReadonlyGoogleGenAI | undefined,
    translator: ReadonlyTranslator | undefined,
    twitchApi: Readonly<TwitchApi> | undefined,
    addedEmotesDatabase: Readonly<AddedEmotesDatabase>,
    pingsDatabase: Readonly<PingsDatabase>,
    permittedRoleIdsDatabase: Readonly<PermittedRoleIdsDatabase>,
    broadcasterNameAndPersonalEmoteSetsDatabase: Readonly<BroadcasterNameAndPersonalEmoteSetsDatabase>,
    cachedUrl: Readonly<CachedUrl>,
    guilds: readonly Readonly<Guild>[],
    twitchClipsMeiliSearch: Readonly<TwitchClipsMeiliSearch> | undefined
  ) {
    this.#client = client;
    this.#openai = openai;
    this.#googleGenAI = googleGenAI;
    this.#translator = translator;
    this.#twitchApi = twitchApi;
    this.#addedEmotesDatabase = addedEmotesDatabase;
    this.#pingsDatabase = pingsDatabase;
    this.#permittedRoleIdsDatabase = permittedRoleIdsDatabase;
    this.#broadcasterNameAndPersonalEmoteSetsDatabase = broadcasterNameAndPersonalEmoteSetsDatabase;
    this.#cachedUrl = cachedUrl;
    this.#guilds = [...guilds];
    this.#twitchClipsMeiliSearch = twitchClipsMeiliSearch;
    this.#commandHandlers = new Map<
      string,
      (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>) => Promise<void>
    >([
      ['emote', emoteHandler()],
      ['emotes', emotesHandler(this.#cachedUrl)],
      ['emotelist', emoteListHandler(this.#emoteMessageBuilders)],
      ['gemini', geminiHandler(this.#googleGenAI)],
      ['clip', clipHandler(this.#twitchClipMessageBuilders)],
      ['addemote', addEmoteHandlerSevenTVNotInSet(this.#addedEmotesDatabase)],
      ['shortestuniquesubstrings', shortestuniquesubstringsHandler(this.#emoteMessageBuilders)],
      ['chatgpt', chatgptHandler(this.#openai)],
      ['translate', translateHandler(this.#translator)],
      ['transient', transientHandler()],
      ['findtheemoji', findTheEmojiHandler()],
      ['pingme', pingMeHandler(this.#pingsDatabase, this.#pingMessageBuilders, this.#client)],
      ['poe2', steamHandler('2694490')],
      ['settings', settingsHandler()],
      ['banned', bannedHandler(this.#twitchApi)]
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

  public registerHandlers(): void {
    this.#client.on(Events.ClientReady, (): void => {
      const { user } = this.#client;
      if (user === null) throw new Error('Bot client user is empty.');

      user.setStatus('online');
      user.setActivity('botge.gitbook.io');
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

      void messageCreateHandler()(message, guild);
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
      if (guildId === null || user.bot) return;

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

      if (interaction.isModalSubmit()) {
        void modalSubmitHandler(
          this.#twitchClipMessageBuilders,
          this.#emoteMessageBuilders,
          guild,
          this.#broadcasterNameAndPersonalEmoteSetsDatabase,
          this.#twitchApi
        )(interaction);
        return;
      }

      if (interaction.isAutocomplete()) {
        const { emoteMatcher, twitchClipsMeiliSearchIndex, uniqueCreatorNames, uniqueGameIds } = guild;

        void autocompleteHandler(
          emoteMatcher,
          twitchClipsMeiliSearchIndex,
          uniqueCreatorNames,
          uniqueGameIds
        )(interaction);
        return;
      }

      if (interaction.isRoleSelectMenu()) {
        void roleSelectMenuHandler(guild, this.#permittedRoleIdsDatabase)(interaction);
        return;
      }

      if (interaction.isButton()) {
        const emoteMessageBuilder = await buttonHandler(
          this.#twitchClipMessageBuilders,
          this.#emoteMessageBuilders,
          this.#pingMessageBuilders,
          guild,
          this.#addedEmotesDatabase,
          this.#permittedRoleIdsDatabase,
          this.#pingsDatabase
        )(interaction);

        if (emoteMessageBuilder !== undefined) this.#emoteMessageBuilders.push(emoteMessageBuilder);
        return;
      }

      if (interaction.isMessageContextMenuCommand()) {
        void messageContextMenuCommandHandler(this.#openai)(interaction);
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
    this.#cleanupPingMessageBuilders(timeNow);
  }

  public async start(discordToken: string | undefined): Promise<void> {
    await this.#client.login(discordToken);
  }

  #cleanupMessageBuilders(messageBuilders: (TwitchClipMessageBuilder | EmoteMessageBuilder)[], timeNow: number): void {
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
    for (const [index, pingMessageBuilder] of this.#pingMessageBuilders.entries()) {
      const difference = timeNow - pingMessageBuilder.interaction.createdAt.getTime();

      if (difference > CLEANUP_MINUTES * 60000) {
        pingMessageBuilder.cleanupPressedMapsJob.cancel();
        this.#pingMessageBuilders.splice(index, 1);
        this.#cleanupPingMessageBuilders(timeNow);
        return;
      }
    }
  }
}
