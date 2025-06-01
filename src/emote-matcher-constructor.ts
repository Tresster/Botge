import { EmoteMatcher } from './emote-matcher.ts';
import type {
  SevenTVEmoteNotInSet,
  BTTVEmote,
  BTTVPersonalEmotes,
  FFZPersonalEmotes,
  FFZGlobalEmotes,
  SevenTVEmotes,
  TwitchGlobalEmotes,
  AddedEmote
} from './types.ts';
import { GLOBAL_EMOTE_ENDPOINTS } from './paths-and-endpoints.ts';
import type { PersonalEmoteSets } from './personal-emote-sets.ts';
import type { TwitchApi } from './api/twitch-api.ts';
import type { AddedEmotesDatabase } from './api/added-emotes-database.ts';
import { fetchAndJson } from './utils/fetch-and-json.ts';

export class GlobalEmoteMatcherConstructor {
  static #instance: Readonly<GlobalEmoteMatcherConstructor> | undefined = undefined;
  readonly #twitchApi: Readonly<TwitchApi> | undefined = undefined;
  readonly #addedEmotesDatabase: Readonly<AddedEmotesDatabase>;
  #sevenTVGlobal: SevenTVEmotes | undefined = undefined;
  #bttvGlobal: readonly BTTVEmote[] | undefined = undefined;
  #ffzGlobal: FFZGlobalEmotes | undefined = undefined;
  #twitchGlobal: TwitchGlobalEmotes | undefined = undefined;

  private constructor(twitchApi: Readonly<TwitchApi> | undefined, addedEmotesDatabase: Readonly<AddedEmotesDatabase>) {
    this.#twitchApi = twitchApi;
    this.#addedEmotesDatabase = addedEmotesDatabase;
  }

  public static get instance(): Readonly<GlobalEmoteMatcherConstructor> {
    if (GlobalEmoteMatcherConstructor.#instance === undefined)
      throw new Error('GlobalEmoteMatcherConstructor instance not created.');

    return GlobalEmoteMatcherConstructor.#instance;
  }

  public get addedEmotesDatabase(): Readonly<AddedEmotesDatabase> {
    return this.#addedEmotesDatabase;
  }
  public get twitchApi(): Readonly<TwitchApi> | undefined {
    return this.#twitchApi;
  }
  public get sevenTVGlobal(): SevenTVEmotes | undefined {
    return this.#sevenTVGlobal;
  }
  public get bttvGlobal(): readonly BTTVEmote[] | undefined {
    return this.#bttvGlobal;
  }
  public get ffzGlobal(): FFZGlobalEmotes | undefined {
    return this.#ffzGlobal;
  }
  public get twitchGlobal(): TwitchGlobalEmotes | undefined {
    return this.#twitchGlobal;
  }

  public static async createInstance(
    twitchApi: Readonly<TwitchApi> | undefined,
    addedEmotesDatabase: Readonly<AddedEmotesDatabase>
  ): Promise<void> {
    GlobalEmoteMatcherConstructor.#instance = new GlobalEmoteMatcherConstructor(twitchApi, addedEmotesDatabase);
    await GlobalEmoteMatcherConstructor.#instance.refreshGlobalEmotes();
  }

  public async refreshGlobalEmotes(): Promise<void> {
    const sevenTVGlobal = fetchAndJson(GLOBAL_EMOTE_ENDPOINTS.sevenTV) as Promise<SevenTVEmotes>;
    const bttvGlobal = fetchAndJson(GLOBAL_EMOTE_ENDPOINTS.bttv) as Promise<readonly BTTVEmote[]>;
    const ffzGlobal = fetchAndJson(GLOBAL_EMOTE_ENDPOINTS.ffz) as Promise<FFZGlobalEmotes>;
    const twitchGlobal = this.#twitchApi?.emotesGlobal();

    this.#sevenTVGlobal = await sevenTVGlobal;
    this.#bttvGlobal = await bttvGlobal;
    this.#ffzGlobal = await ffzGlobal;
    this.#twitchGlobal = await twitchGlobal;
  }
}

export class PersonalEmoteMatcherConstructor {
  readonly #guildId: string;
  #personalEmoteSets: PersonalEmoteSets | undefined;
  #sevenTVPersonal: SevenTVEmotes | undefined = undefined;
  #bttvPersonal: BTTVPersonalEmotes | undefined = undefined;
  #ffzPersonal: FFZPersonalEmotes | undefined = undefined;
  #addedEmotes: SevenTVEmoteNotInSet[] | undefined = undefined;

  private constructor(guildId: string, personalEmoteSets: PersonalEmoteSets | undefined) {
    this.#guildId = guildId;
    this.#personalEmoteSets = personalEmoteSets;
  }

  public get personalEmoteSets(): PersonalEmoteSets | undefined {
    return this.#personalEmoteSets;
  }

  public static async create(
    guildId: string,
    personalEmoteSets: PersonalEmoteSets | undefined
  ): Promise<Readonly<PersonalEmoteMatcherConstructor>> {
    const personalEmoteMatcherConstructor = new PersonalEmoteMatcherConstructor(guildId, personalEmoteSets);

    const refreshBTTVAndFFZPersonalEmotes_ = personalEmoteMatcherConstructor.refreshBTTVAndFFZPersonalEmotes();
    const refreshAddedEmotes_ = personalEmoteMatcherConstructor.#refreshAddedEmotes();

    await refreshBTTVAndFFZPersonalEmotes_;
    await refreshAddedEmotes_;
    return personalEmoteMatcherConstructor;
  }

  public async changePersonalEmoteSets(
    personalEmoteSets: PersonalEmoteSets
  ): Promise<Readonly<EmoteMatcher> | undefined> {
    if (this.#personalEmoteSets === undefined) {
      this.#personalEmoteSets = personalEmoteSets;
      const { sevenTv, bttv, ffz } = this.#personalEmoteSets;
      if (bttv !== null || ffz !== null || sevenTv !== null) {
        if (bttv !== null || ffz !== null) await this.refreshBTTVAndFFZPersonalEmotes();
        return await this.constructEmoteMatcher();
      }

      return undefined;
    }

    const { sevenTv, bttv, ffz } = this.#personalEmoteSets;
    const newSevenTvPersonal = personalEmoteSets.sevenTv;
    const newBttvPersonal = personalEmoteSets.bttv;
    const newFfzPersonal = personalEmoteSets.ffz;

    if (bttv !== newBttvPersonal || ffz !== newFfzPersonal || sevenTv !== newSevenTvPersonal) {
      this.#personalEmoteSets = personalEmoteSets;

      if (bttv !== newBttvPersonal || ffz !== newFfzPersonal) await this.refreshBTTVAndFFZPersonalEmotes();
      return await this.constructEmoteMatcher();
    }

    return undefined;
  }

  public async constructEmoteMatcher(): Promise<Readonly<EmoteMatcher>> {
    const globalEmoteMatcherConstructor = GlobalEmoteMatcherConstructor.instance;

    if (
      globalEmoteMatcherConstructor.sevenTVGlobal === undefined ||
      globalEmoteMatcherConstructor.bttvGlobal === undefined ||
      globalEmoteMatcherConstructor.ffzGlobal === undefined
    )
      throw new Error('Global emotes not assigned.');

    const sevenTVPersonal =
      this.#personalEmoteSets !== undefined && this.#personalEmoteSets.sevenTv !== null
        ? (fetchAndJson(this.#personalEmoteSets.sevenTv) as Promise<SevenTVEmotes>)
        : undefined;
    this.#sevenTVPersonal = await sevenTVPersonal;

    return new EmoteMatcher(
      globalEmoteMatcherConstructor.sevenTVGlobal,
      globalEmoteMatcherConstructor.bttvGlobal,
      globalEmoteMatcherConstructor.ffzGlobal,
      globalEmoteMatcherConstructor.twitchGlobal,
      this.#sevenTVPersonal,
      this.#bttvPersonal,
      this.#ffzPersonal,
      this.#addedEmotes
    );
  }

  public async refreshBTTVAndFFZPersonalEmotes(): Promise<void> {
    if (this.#personalEmoteSets === undefined) return;

    const bttvPersonal =
      this.#personalEmoteSets.bttv !== null
        ? (fetchAndJson(this.#personalEmoteSets.bttv) as Promise<BTTVPersonalEmotes>)
        : undefined;
    const ffzPersonal =
      this.#personalEmoteSets.ffz !== null
        ? (fetchAndJson(this.#personalEmoteSets.ffz) as Promise<FFZPersonalEmotes>)
        : undefined;

    this.#bttvPersonal = await bttvPersonal;
    this.#ffzPersonal = await ffzPersonal;
  }

  public addSevenTVEmoteNotInSet(sevenTVEmoteNotInSet: SevenTVEmoteNotInSet): void {
    this.#addedEmotes?.push(sevenTVEmoteNotInSet);
  }

  public removeSevenTVEmoteNotInSet(addedEmote: AddedEmote): void {
    const { alias } = addedEmote;
    if (this.#addedEmotes === undefined) return;
    if (alias === null) return;

    const toRemoveIndex = this.#addedEmotes.findIndex((sevenTVEmoteNotInSet_) => sevenTVEmoteNotInSet_.name === alias);
    if (toRemoveIndex === -1) return;

    this.#addedEmotes.splice(toRemoveIndex, 1);
  }

  async #refreshAddedEmotes(): Promise<void> {
    const globalEmoteMatcherConstructor = GlobalEmoteMatcherConstructor.instance;

    const addedEmotes = globalEmoteMatcherConstructor.addedEmotesDatabase.getAll(this.#guildId);
    const sevenTVEmoteNotInSets = await (async (): Promise<SevenTVEmoteNotInSet[]> => {
      const sevenTVEmoteNotInSets_ = (
        (await Promise.all(
          addedEmotes.map(async (addedEmote) => fetchAndJson(addedEmote.url))
        )) as SevenTVEmoteNotInSet[]
      ).map((sevenTVEmoteNotInSet, index) => {
        const { alias } = addedEmotes[index];

        if (alias !== null) return { ...sevenTVEmoteNotInSet, name: alias };
        else return sevenTVEmoteNotInSet;
      });

      return sevenTVEmoteNotInSets_;
    })();

    this.#addedEmotes = sevenTVEmoteNotInSets;
  }
}
