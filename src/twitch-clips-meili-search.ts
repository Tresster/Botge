/** @format */

import type { MeiliSearch, Index } from 'meilisearch';

const INDEX_NAME = 'twitchClips';

function getIndexName(guildId: string): string {
  return `${INDEX_NAME}_${guildId}`;
}

const MAX_TOTAL_HITS = 3000;

export class TwitchClipsMeiliSearch {
  readonly #meiliSearch: Readonly<MeiliSearch>;

  public constructor(meiliSearch: MeiliSearch) {
    this.#meiliSearch = meiliSearch;
  }

  public async getOrCreateIndex(guildId: string): Promise<Index | undefined> {
    const indexName = getIndexName(guildId);

    await this.#meiliSearch
      .createIndex(indexName, {
        primaryKey: 'id'
      })
      .waitTask();

    const index = await this.#meiliSearch.getIndex(indexName);
    await index.updatePagination({ maxTotalHits: MAX_TOTAL_HITS }).waitTask();

    await index.updateSearchableAttributes(['title']).waitTask();
    await index.updateFilterableAttributes(['creator_name', 'game_id']).waitTask();
    await index.updateSortableAttributes(['view_count', 'created_at']).waitTask();

    return index;
  }
}
