/** @format */
import { EmoteMatcher } from './emote-matcher.ts';
import type {
  SevenTVEmoteNotInSet,
  BTTVEmote,
  FFZGlobalEmotes,
  SevenTVEmotes,
  TwitchGlobalEmotes,
  AddedEmote
} from './types.ts';
import type { PersonalEmoteSets } from './personal-emote-sets.ts';
import type { TwitchApi } from './api/twitch-api.ts';
import type { AddedEmotesDatabase } from './api/added-emotes-database.ts';
export declare class GlobalEmoteMatcherConstructor {
  #private;
  private constructor();
  static get instance(): Readonly<GlobalEmoteMatcherConstructor>;
  get addedEmotesDatabase(): Readonly<AddedEmotesDatabase>;
  get twitchApi(): Readonly<TwitchApi> | undefined;
  get sevenTVGlobal(): SevenTVEmotes | undefined;
  get bttvGlobal(): readonly BTTVEmote[] | undefined;
  get ffzGlobal(): FFZGlobalEmotes | undefined;
  get twitchGlobal(): TwitchGlobalEmotes | undefined;
  static createInstance(
    twitchApi: Readonly<TwitchApi> | undefined,
    addedEmotesDatabase: Readonly<AddedEmotesDatabase>
  ): Promise<void>;
  refreshGlobalEmotes(): Promise<void>;
}
export declare class PersonalEmoteMatcherConstructor {
  #private;
  private constructor();
  get personalEmoteSets(): PersonalEmoteSets | undefined;
  static create(
    guildId: string,
    personalEmoteSets: PersonalEmoteSets | undefined
  ): Promise<Readonly<PersonalEmoteMatcherConstructor>>;
  changePersonalEmoteSets(personalEmoteSets: PersonalEmoteSets): Promise<Readonly<EmoteMatcher> | undefined>;
  constructEmoteMatcher(): Promise<Readonly<EmoteMatcher>>;
  refreshBTTVAndFFZPersonalEmotes(): Promise<void>;
  addSevenTVEmoteNotInSet(sevenTVEmoteNotInSet: SevenTVEmoteNotInSet): void;
  removeSevenTVEmoteNotInSet(addedEmote: AddedEmote): void;
}
