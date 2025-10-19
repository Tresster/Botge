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

import {
  sevenTVInSetToAsset,
  sevenTVNotInSetToAsset,
  bttvToAsset,
  ffzToAsset,
  twitchToAsset
} from './utils/emote-to-asset.ts';

const FFZGLOBALSETSKEY = 3;

class EmoteNode {
  public highestPriority: number;
  public assets: AssetInfo[];
  public uniquePath: boolean;

  public constructor(priority: number, asset: AssetInfo) {
    this.highestPriority = priority;
    this.assets = [asset];
    this.uniquePath = true;
  }
}

class SuffixTree {
  readonly #paths: Map<string, SuffixTree>;
  #data: EmoteNode | undefined;

  public constructor() {
    this.#paths = new Map();
    this.#data = undefined;
  }

  public addAllSuffix(asset: AssetInfo, priority: number): void {
    const normalized = asset.name.toLowerCase();
    for (let i = 0; i < normalized.length; i++) {
      this._addAllSuffix(normalized.slice(i), priority, asset);
    }
  }

  public query(suffix: string): AssetInfo | undefined {
    return this._query(suffix.toLowerCase(), suffix);
  }

  public queryArray(
    suffix: string,
    original: string,
    platform?: Platform,
    animated?: boolean,
    zeroWidth?: boolean,
    max?: number,
    sortByDateAdded?: boolean,
    sortByName?: boolean
  ): readonly AssetInfo[] | undefined {
    return this._queryArray(
      suffix.toLowerCase(),
      original,
      platform,
      animated,
      zeroWidth,
      max,
      sortByDateAdded,
      sortByName
    );
  }

  public queryUnique(suffix: string, original: string): boolean {
    return this._queryUnique(suffix.toLowerCase(), original);
  }

  public queryExact(suffix: string): boolean {
    return this._queryExact(suffix.toLowerCase(), suffix);
  }

  private _addAllSuffix(suffix: string, priority: number, asset: AssetInfo): void {
    if (this.#data === undefined) {
      this.#data = new EmoteNode(priority, asset);
    } else {
      this.#data.uniquePath = false;
      if (priority > this.#data.highestPriority) {
        this.#data.highestPriority = priority;
        this.#data.assets.unshift(asset);
      } else {
        this.#data.assets.push(asset);
      }
    }

    if (suffix !== '') {
      const tree = this.#getOrAddTree(suffix.charAt(0));
      tree?._addAllSuffix(suffix.slice(1), priority, asset);
      return;
    }
  }

  private _query(normalizedSuffix: string, original: string): AssetInfo | undefined {
    if (normalizedSuffix === '') {
      if (this.#data === undefined) return undefined;
      // reached the end of the query string

      for (const asset of this.#data.assets) {
        if (asset.name === original) return asset;
      }

      for (const asset of this.#data.assets) {
        if (asset.name.toLowerCase() === original.toLowerCase()) return asset;
      }

      return this.#data.assets[0];
    }

    const nextChar = normalizedSuffix.charAt(0);
    if (!this.#paths.has(nextChar)) return undefined;
    return this.#paths.get(nextChar)?._query(normalizedSuffix.slice(1), original) ?? undefined;
  }

  private _queryArray(
    normalizedSuffix: string,
    original: string,
    platform?: Platform,
    animated?: boolean,
    zeroWidth?: boolean,
    max?: number,
    sortByDateAdded?: boolean,
    sortByName?: boolean
  ): readonly AssetInfo[] | undefined {
    if (normalizedSuffix !== '') {
      const nextChar = normalizedSuffix.charAt(0);
      if (!this.#paths.has(nextChar)) return undefined;
      return (
        this.#paths
          .get(nextChar)
          ?._queryArray(
            normalizedSuffix.slice(1),
            original,
            platform,
            animated,
            zeroWidth,
            max,
            sortByDateAdded,
            sortByName
          ) ?? undefined
      );
    }

    let assets: AssetInfo[] = [];
    for (const asset of this.#data?.assets ?? []) {
      if (asset.name.includes(normalizedSuffix) && !assets.includes(asset)) assets.push(asset);
    }

    if (platform !== undefined) assets = assets.filter((asset) => asset.platform === platform);
    if (animated !== undefined) assets = assets.filter((asset) => asset.animated === animated);
    if (zeroWidth !== undefined) assets = assets.filter((asset) => asset.zeroWidth === zeroWidth);

    if (assets.length === 0) return undefined;

    //reached the end of the iteration, return
    if (sortByDateAdded !== undefined && sortByDateAdded) {
      const assetsTimestampNotUndefined = assets.filter((asset) => asset.timestamp !== undefined);
      const assetsTimestampUndefined = assets.filter((asset) => asset.timestamp === undefined);

      assetsTimestampNotUndefined.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
      assets = [...assetsTimestampNotUndefined, ...assetsTimestampUndefined];
    } else if (sortByName !== undefined && sortByName) {
      assets.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (original !== '') {
      const exactCaseMatch = ((): AssetInfo | undefined => {
        const exactCaseMatchIndex = assets.findIndex((asset) => asset.name === original);
        return exactCaseMatchIndex !== -1 ? assets.splice(exactCaseMatchIndex, 1)[0] : undefined;
      })();

      const lowerCaseMatch = ((): AssetInfo | undefined => {
        const lowerCaseMatchIndex = assets.findIndex((asset) => asset.name.toLowerCase() === original.toLowerCase());
        return lowerCaseMatchIndex !== -1 ? assets.splice(lowerCaseMatchIndex, 1)[0] : undefined;
      })();

      const startsWithLowerCaseMatches: AssetInfo[] = [];
      this.#getStartsWithLowerCaseMatches(assets, original.toLowerCase(), startsWithLowerCaseMatches);

      assets.unshift(...startsWithLowerCaseMatches);
      if (lowerCaseMatch !== undefined) assets.unshift(lowerCaseMatch);
      if (exactCaseMatch !== undefined) assets.unshift(exactCaseMatch);
    }

    if (max !== undefined) return assets.slice(0, max);
    return assets;
  }

  private _queryUnique(normalizedSuffix: string, original: string): boolean {
    if (normalizedSuffix === '') {
      if (this.#data === undefined) return false;
      if (this.#data.uniquePath && this.#data.assets[0].name === original) return true;
      return false;
    }

    const nextChar = normalizedSuffix.charAt(0);
    if (!this.#paths.has(nextChar)) return false;
    return this.#paths.get(nextChar)?._queryUnique(normalizedSuffix.slice(1), original) ?? false;
  }

  private _queryExact(normalizedSuffix: string, original: string): boolean {
    if (normalizedSuffix === '') {
      if (this.#data === undefined) return false;
      // reached the end of the query string
      for (const asset of this.#data.assets) {
        // exact match and case match
        if (asset.name === original) return true;
      }

      return false;
    }

    const nextChar = normalizedSuffix.charAt(0);
    if (!this.#paths.has(nextChar)) return false;
    return this.#paths.get(nextChar)?._queryExact(normalizedSuffix.slice(1), original) ?? false;
  }

  #getStartsWithLowerCaseMatches(
    assets: AssetInfo[],
    startsWithLowerCase: string,
    startsWithLowerCaseMatches: AssetInfo[]
  ): void {
    for (const [index, asset] of assets.entries()) {
      if (!asset.name.toLowerCase().startsWith(startsWithLowerCase)) continue;

      const [splicedAsset] = assets.splice(index, 1);
      startsWithLowerCaseMatches.push(splicedAsset);

      this.#getStartsWithLowerCaseMatches(assets, startsWithLowerCase, startsWithLowerCaseMatches);
      return;
    }
  }

  #getOrAddTree(char: string): SuffixTree | undefined {
    if (!this.#paths.has(char)) this.#paths.set(char, new SuffixTree());
    return this.#paths.get(char);
  }
}

export class EmoteMatcher {
  readonly #root: Readonly<SuffixTree>;
  readonly #priority: number;

  public constructor(
    sevenGlobal: SevenTVEmotes,
    bttvGlobal: readonly BTTVEmote[],
    ffzGlobal: FFZGlobalEmotes,
    twitchGlobal: TwitchGlobalEmotes | undefined,
    sevenPersonal: SevenTVEmotes | undefined,
    bttvPersonal: BTTVPersonalEmotes | undefined,
    ffzPersonal: FFZPersonalEmotes | undefined,
    sevenNotInSet: readonly Readonly<SevenTVEmoteNotInSet>[] | undefined
  ) {
    this.#root = new SuffixTree();
    let priority = arguments.length;

    for (const emote of sevenGlobal.emotes) this.#root.addAllSuffix(sevenTVInSetToAsset(emote), priority);
    priority--;

    for (const emote of bttvGlobal) this.#root.addAllSuffix(bttvToAsset(emote), priority);
    priority--;

    for (const emote of ffzGlobal.sets[`${FFZGLOBALSETSKEY}`].emoticons)
      this.#root.addAllSuffix(ffzToAsset(emote), priority);
    priority--;

    for (const emote of twitchGlobal?.data ?? []) this.#root.addAllSuffix(twitchToAsset(emote), priority);
    if (twitchGlobal !== undefined) priority--;

    for (const emote of sevenPersonal?.emotes ?? []) this.#root.addAllSuffix(sevenTVInSetToAsset(emote), priority);
    if (sevenPersonal !== undefined) priority--;

    for (const emote of bttvPersonal?.channelEmotes ?? []) this.#root.addAllSuffix(bttvToAsset(emote), priority);
    if (bttvPersonal !== undefined) priority--;

    for (const emote of bttvPersonal?.sharedEmotes ?? []) this.#root.addAllSuffix(bttvToAsset(emote), priority);
    if (bttvPersonal !== undefined) priority--;

    for (const emote of ffzPersonal?.sets[ffzPersonal.room.set].emoticons ?? [])
      this.#root.addAllSuffix(ffzToAsset(emote), priority);
    if (ffzPersonal !== undefined) priority--;

    for (const emote of sevenNotInSet ?? []) {
      //there may be a case where an emote was added with /addemote
      //and afterwards added to the channel
      //or it was added to 7tv global emotes
      if (emote.error !== undefined) continue;
      if (this.matchSingleExact(emote.name)) continue;

      this.#root.addAllSuffix(sevenTVNotInSetToAsset(emote), priority);
    }

    this.#priority = priority;
  }

  public matchSingle(query: string): AssetInfo | undefined {
    return this.#root.query(query);
  }

  public matchSingleArray(
    query: string,
    platform?: Platform,
    animated?: boolean,
    zeroWidth?: boolean,
    max?: number,
    sortByDateAdded?: boolean,
    sortByName?: boolean
  ): readonly AssetInfo[] | undefined {
    return this.#root.queryArray(query, query, platform, animated, zeroWidth, max, sortByDateAdded, sortByName);
  }

  public matchSingleUnique(query: string, original: string): boolean {
    return this.#root.queryUnique(query, original);
  }

  public matchSingleExact(query: string): boolean {
    return this.#root.queryExact(query);
  }

  // returns undefined for unmatched
  public matchMulti(queries: readonly string[]): readonly (AssetInfo | undefined)[] {
    return queries.map((query) => (query.length !== 1 ? this.#root.query(query) : undefined));
  }

  public addSevenTVEmoteNotInSetSuffix(emote: Readonly<SevenTVEmoteNotInSet>): void {
    this.#root.addAllSuffix(sevenTVNotInSetToAsset(emote), this.#priority);
  }
}
