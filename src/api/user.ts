import Database from 'better-sqlite3';

const TABLE_NAME = 'users';

export class UsersDatabase {
  readonly #database: Database.Database;

  public constructor(filepath: string) {
    this.#database = new Database(filepath);
    this.#createTable();
  }

  public changeGuildId(userId: string, guildId: string): void {
    if (this.#rowExists(userId)) {
      const update = this.#database.prepare(`UPDATE ${TABLE_NAME} SET guildId=(?) WHERE userId=(?)`);
      update.run(guildId, userId);
    } else {
      const insert = this.#database.prepare(`INSERT INTO ${TABLE_NAME} VALUES(?,?)`);
      insert.run(userId, guildId);
    }
  }

  public getAllUsers(): Readonly<Map<string, readonly [string]>> {
    const select = this.#database.prepare(`SELECT userId, guildId FROM ${TABLE_NAME}`);

    const selectAll = select.all() as readonly {
      readonly userId: string;
      readonly guildId: string;
    }[];

    const map = new Map<string, readonly [string]>();
    selectAll.forEach((selectAll_) => map.set(selectAll_.userId, [selectAll_.guildId]));
    return map;
  }

  #createTable(): void {
    const createTable = this.#database.prepare(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        userId TEXT NOT NULL PRIMARY KEY,
        guildId TEXT NOT NULL
      );
    `);

    createTable.run();
  }

  #rowExists(userId: string): boolean {
    const select = this.#database.prepare(`SELECT userId FROM ${TABLE_NAME} WHERE userId=(?)`);
    const select_ = select.get(userId);

    if (select_ === undefined) return false;
    return true;
  }
}
