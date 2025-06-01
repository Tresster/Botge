import Database from 'better-sqlite3';
import { PersonalEmoteSets } from '../personal-emote-sets.ts';

const TABLE_NAME = 'assignedEmoteSets';

export class BroadcasterNameAndPersonalEmoteSetsDatabase {
  readonly #database: Database.Database;

  public constructor(filepath: string) {
    this.#database = new Database(filepath);
    this.#createTable();
  }

  public changePersonalEmoteSets(guildId: string, personalEmoteSets: PersonalEmoteSets): void {
    const { sevenTv, bttv, ffz } = personalEmoteSets;
    if (this.#rowExists(guildId)) {
      const update = this.#database.prepare(
        `UPDATE ${TABLE_NAME} SET sevenTv=(?), bttv=(?), ffz=(?) WHERE guildId=(?)`
      );
      update.run(sevenTv, bttv, ffz, guildId);
    } else {
      const insert = this.#database.prepare(`INSERT INTO ${TABLE_NAME} VALUES(?,?,?,?,?)`);
      insert.run(guildId, null, sevenTv, bttv, ffz);
    }
  }

  public changeBroadcasterName(guildId: string, broadcasterName: string): void {
    if (this.#rowExists(guildId)) {
      const update = this.#database.prepare(`UPDATE ${TABLE_NAME} SET broadcasterName=(?) WHERE guildId=(?)`);
      update.run(broadcasterName, guildId);
    } else {
      const insert = this.#database.prepare(`INSERT INTO ${TABLE_NAME} VALUES(?,?,?,?,?)`);
      insert.run(guildId, broadcasterName, null, null, null);
    }
  }

  public getPersonalEmoteSets(guildId: string): readonly [string | null, PersonalEmoteSets] {
    const select = this.#database.prepare(
      `SELECT broadcasterName, sevenTv, bttv, ffz FROM ${TABLE_NAME} WHERE guildId=(?)`
    );
    const select_ = select.get(guildId) as {
      readonly broadcasterName: string | null;
      readonly sevenTv: string | null;
      readonly bttv: string | null;
      readonly ffz: string | null;
    };

    return [select_.broadcasterName, new PersonalEmoteSets(select_.sevenTv, select_.bttv, select_.ffz)];
  }

  public getAllBroadcasterNamesAndPersonalEmoteSets(): Readonly<
    Map<string, readonly [string | null, PersonalEmoteSets]>
  > {
    const select = this.#database.prepare(`SELECT guildId, broadcasterName, sevenTv, bttv, ffz FROM ${TABLE_NAME}`);

    const selectAll = select.all() as readonly {
      readonly guildId: string;
      readonly broadcasterName: string | null;
      readonly sevenTv: string | null;
      readonly bttv: string | null;
      readonly ffz: string | null;
    }[];

    const map = new Map<string, readonly [string | null, PersonalEmoteSets]>();
    selectAll.forEach((selectAll_) =>
      map.set(selectAll_.guildId, [
        selectAll_.broadcasterName,
        new PersonalEmoteSets(selectAll_.sevenTv, selectAll_.bttv, selectAll_.ffz)
      ])
    );
    return map;
  }

  public close(): void {
    this.#database.close();
  }

  #createTable(): void {
    const createTable = this.#database.prepare(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        guildId TEXT NOT NULL PRIMARY KEY,
        broadcasterName TEXT,
        sevenTv TEXT,
        bttv TEXT,
        ffz TEXT
      );
    `);

    createTable.run();
  }

  #rowExists(guildId: string): boolean {
    const select = this.#database.prepare(`SELECT guildId FROM ${TABLE_NAME} WHERE guildId=(?)`);
    const select_ = select.get(guildId);

    if (select_ === undefined) return false;
    return true;
  }
}
