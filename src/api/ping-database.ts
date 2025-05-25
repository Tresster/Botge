import Database from 'better-sqlite3';

import type { Ping } from '../types.js';

const TABLE_NAME = 'pings';

function getId(ping: Ping): string {
  return `${ping.time}_${ping.userId}_${ping.channelId}`;
}

export class PingsDatabase {
  readonly #database: Database.Database;

  public constructor(filepath: string) {
    this.#database = new Database(filepath);
    this.#createTable();
    this.#alterTable();
  }

  public insert(ping: Ping): void {
    const insert = this.#database.prepare(
      `INSERT INTO ${TABLE_NAME} (id,time,hours,minutes,userId,channelId,message) VALUES (?,?,?,?,?,?,?)`
    );
    const { time, hours, minutes, userId, channelId, message } = ping;
    insert.run(getId(ping), time, hours, minutes, userId, channelId, message);
  }

  public delete(ping: Ping): void {
    const del = this.#database.prepare(`DELETE FROM ${TABLE_NAME} WHERE id=(?)`);
    del.run(getId(ping));
  }

  public updateUserIds(ping: Ping): void {
    if (this.#rowExists(ping)) {
      const update = this.#database.prepare(`UPDATE ${TABLE_NAME} SET userIds=(?) WHERE id=(?)`);

      const { userIds } = ping;
      const userIdsJoined = userIds !== null ? (userIds.length !== 0 ? userIds.join(',') : null) : null;
      update.run(userIdsJoined, getId(ping));
    }
  }

  public updateUserIdRemoved(ping: Ping): void {
    if (this.#rowExists(ping)) {
      const update = this.#database.prepare(`UPDATE ${TABLE_NAME} SET userIdRemoved=(?) WHERE id=(?)`);

      const { userIdRemoved } = ping;
      const userIdRemovedUpdated = userIdRemoved !== null ? Number(userIdRemoved) : null;
      update.run(userIdRemovedUpdated, getId(ping));
    }
  }

  public getAll(): readonly Ping[] {
    const select = this.#database.prepare(
      `SELECT time,hours,minutes,userId,channelId,message,userIds,userIdRemoved FROM ${TABLE_NAME}`
    );
    const pingsSelected = select.all() as readonly Readonly<{
      time: number;
      hours: number | null;
      minutes: number | null;
      userId: string;
      channelId: string;
      message: string | null;
      userIds: string | null;
      userIdRemoved: number | null;
    }>[];

    return pingsSelected.map((pingSelected) => {
      const pingSelectedUserIds = pingSelected.userIds;
      const pingUserIds = pingSelectedUserIds !== null ? pingSelectedUserIds.split(',') : null;

      const pingSelectedUserIdRemoved = pingSelected.userIdRemoved;
      const pingUserIdRemoved = pingSelectedUserIdRemoved !== null ? Boolean(pingSelectedUserIdRemoved) : null;

      return { ...pingSelected, userIds: pingUserIds, userIdRemoved: pingUserIdRemoved } as Ping;
    });
  }

  public close(): void {
    this.#database.close();
  }

  #createTable(): void {
    const createTable = this.#database.prepare(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id TEXT NOT NULL PRIMARY KEY,
        time INTEGER NOT NULL,
        hours INTEGER,
        minutes INTEGER,
        userId TEXT NOT NULL,
        channelId TEXT NOT NULL,
        message TEXT,
        userIds TEXT,
        userIdRemoved INTEGER
      );
    `);

    createTable.run();
  }

  #alterTable(): void {
    const columnExistsUserIds = this.#database.prepare(
      `SELECT COUNT(*) AS CNTREC FROM pragma_table_info('${TABLE_NAME}') WHERE name='userIds'`
    );
    const columnExistsUserIdsRan = columnExistsUserIds.get() as { CNTREC: number };

    if (columnExistsUserIdsRan.CNTREC === 0) {
      const alterTable = this.#database.prepare(`ALTER TABLE ${TABLE_NAME} ADD userIds TEXT`);
      alterTable.run();
    }

    const columnExistsUserIdRemoved = this.#database.prepare(
      `SELECT COUNT(*) AS CNTREC FROM pragma_table_info('${TABLE_NAME}') WHERE name='userIdRemoved'`
    );
    const columnExistsUserIdRemovedRan = columnExistsUserIdRemoved.get() as { CNTREC: number };

    if (columnExistsUserIdRemovedRan.CNTREC === 0) {
      const alterTable = this.#database.prepare(`ALTER TABLE ${TABLE_NAME} ADD userIdRemoved INTEGER`);
      alterTable.run();
    }
  }

  #rowExists(ping: Ping): boolean {
    const select = this.#database.prepare(`SELECT id FROM ${TABLE_NAME} WHERE id=(?)`);
    const select_ = select.get(getId(ping));

    if (select_ === undefined) return false;
    return true;
  }
}
