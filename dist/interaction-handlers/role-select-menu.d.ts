/** @format */
import { type RoleSelectMenuInteraction } from 'discord.js';
import type { Guild } from '../guild.ts';
import type { PermittedRoleIdsDatabase } from '../api/permitted-role-ids-database.ts';
export declare function roleSelectMenuHandler(
  guild: Readonly<Guild>,
  permittedRoleIdsDatabase: Readonly<PermittedRoleIdsDatabase>
): (interaction: RoleSelectMenuInteraction) => Promise<void>;
