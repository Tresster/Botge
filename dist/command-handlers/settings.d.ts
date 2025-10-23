/** @format */
import { type ChatInputCommandInteraction } from 'discord.js';
import type { Guild } from '../guild.ts';
export declare const SETTINGS_PERMITTED_ROLES_BUTTON_CUSTOM_ID = 'settingsPermittedRolesButton';
export declare const ADD_EMOTE_PERMITTED_ROLES_BUTTON_CUSTOM_ID = 'addEmotePermittedRolesButton';
export declare const ALLOW_EVERYONE_TO_ADD_EMOTE_BUTTON_CUSTOM_ID = 'allowEveryoneToAddEmoteButton';
export declare const ADDED_EMOTE_DELETION_MENU_BUTTON_CUSTOM_ID = 'addedEmoteDeletionMenuButton';
export declare const CONFIGURATION_GUILD_BUTTON_CUSTOM_ID = 'configurationGuildButton';
export declare const CONFIGURATION_USER_BUTTON_CUSTOM_ID = 'configurationUserButton';
export declare function settingsHandler(): (
  interaction: ChatInputCommandInteraction,
  guild: Readonly<Guild> | undefined
) => Promise<void>;
