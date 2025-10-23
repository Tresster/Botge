/** @format */
import type { MeiliSearch, Index } from 'meilisearch';
export declare class TwitchClipsMeiliSearch {
  #private;
  constructor(meiliSearch: MeiliSearch);
  getOrCreateIndex(guildId: string): Promise<Index | undefined>;
}
