/** @format */
export declare class PermittedRoleIdsDatabase {
  #private;
  constructor(filepath: string);
  changeSettingsPermittedRoleIds(guildId: string, roleIds: readonly string[]): void;
  changeAddEmotePermittedRoleIds(guildId: string, roleIds: readonly string[]): void;
  changeAllowEveryoneToAddEmote(guildId: string, permitNoRole: boolean): void;
  getSettingsPermittedRoleIds(guildId: string): readonly string[] | null;
  getAddEmotePermittedRoleIds(guildId: string): readonly string[] | null;
  getAddEmotePermitNoRole(guildId: string): boolean;
  createTable(guildId: string): void;
  close(): void;
}
