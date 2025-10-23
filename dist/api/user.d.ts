/** @format */
export declare class UsersDatabase {
  #private;
  constructor(filepath: string);
  changeGuildId(userId: string, guildId: string): void;
  getAllUsers(): Readonly<Map<string, readonly [string]>>;
  close(): void;
}
