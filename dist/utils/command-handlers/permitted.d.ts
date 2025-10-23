/** @format */
import type { Role, GuildMember, Guild } from 'discord.js';
export declare function administrator(memberRolesCache: readonly (readonly [string, Role])[]): boolean;
export declare function permitted(
  memberRolesCache: readonly (readonly [string, Role])[],
  permittedRoleIds: readonly string[] | null
): boolean;
export declare function owner(member: GuildMember, guild: Guild): boolean;
export declare function globalAdministrator(member: GuildMember): boolean;
