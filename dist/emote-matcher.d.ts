/** @format */
import type { Platform } from './enums.ts';
import type {
  SevenTVEmoteNotInSet,
  BTTVEmote,
  SevenTVEmotes,
  BTTVPersonalEmotes,
  FFZPersonalEmotes,
  FFZGlobalEmotes,
  TwitchGlobalEmotes,
  AssetInfo
} from './types.ts';
export declare class EmoteMatcher {
  #private;
  constructor(
    sevenGlobal: SevenTVEmotes,
    bttvGlobal: readonly BTTVEmote[],
    ffzGlobal: FFZGlobalEmotes,
    twitchGlobal: TwitchGlobalEmotes | undefined,
    sevenPersonal: SevenTVEmotes | undefined,
    bttvPersonal: BTTVPersonalEmotes | undefined,
    ffzPersonal: FFZPersonalEmotes | undefined,
    sevenNotInSet: readonly Readonly<SevenTVEmoteNotInSet>[] | undefined
  );
  matchSingle(query: string): AssetInfo | undefined;
  matchSingleArray(
    query: string,
    platform?: Platform,
    animated?: boolean,
    zeroWidth?: boolean,
    max?: number,
    sortByDateAdded?: boolean,
    sortByName?: boolean
  ): readonly AssetInfo[] | undefined;
  matchSingleUnique(query: string, original: string): boolean;
  matchSingleExact(query: string): boolean;
  matchMulti(queries: readonly string[]): readonly (AssetInfo | undefined)[];
  addSevenTVEmoteNotInSetSuffix(emote: Readonly<SevenTVEmoteNotInSet>): void;
}
