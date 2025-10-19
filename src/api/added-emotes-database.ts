/** @format */

import Database from 'better-sqlite3';

import type { AddedEmote } from '../types.ts';

const TABLE_NAME = 'addedEmotes';

function getTableName(guildId: string): string {
  return `${TABLE_NAME}_${guildId}`;
}

export class AddedEmotesDatabase {
  readonly #database: Database.Database;

  public constructor(filepath: string) {
    this.#database = new Database(filepath);
  }

  public insert(addedEmote: AddedEmote, guildId: string): void {
    const { url, alias } = addedEmote;

    const prepare_ = this.#database.prepare(`INSERT INTO ${getTableName(guildId)} (url,alias) VALUES (?,?)`);
    prepare_.run(url, alias);
  }

  public delete(addedEmote: AddedEmote, guildId: string): void {
    const { url, alias } = addedEmote;

    const prepare_ = this.#database.prepare(
      `DELETE FROM ${getTableName(guildId)} WHERE url=(?) AND (alias=(?) OR alias IS NULL)`
    );
    prepare_.run(url, alias);
  }

  public getAll(guildId: string): readonly AddedEmote[] {
    const select = this.#database.prepare(`SELECT url,alias FROM ${getTableName(guildId)}`);
    const addedEmotes = select.all() as readonly AddedEmote[];

    return addedEmotes;
  }

  public createTable(guildId: string): void {
    const tableName = getTableName(guildId);

    const createTable = this.#database.prepare(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        url TEXT NOT NULL PRIMARY KEY,
        alias TEXT
      );
    `);

    createTable.run();
  }

  public close(): void {
    this.#database.close();
  }
}
