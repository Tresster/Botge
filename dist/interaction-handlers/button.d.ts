/** @format */
import { type ButtonInteraction } from 'discord.js';
import { PingForPingMeMessageBuilder } from '../message-builders/ping-for-ping-me-message-builder.ts';
import { PingForPingListMessageBuilder } from '../message-builders/ping-for-ping-list-message-builder.ts';
import { TwitchClipMessageBuilder } from '../message-builders/twitch-clip-message-builder.ts';
import { EmoteMessageBuilder } from '../message-builders/emote-message-builder.ts';
import type { PermittedRoleIdsDatabase } from '../api/permitted-role-ids-database.ts';
import type { AddedEmotesDatabase } from '../api/added-emotes-database.ts';
import type { PingsDatabase } from '../api/ping-database.ts';
import type { Guild } from '../guild.ts';
import type { User } from '../user.ts';
export declare const SELECT_SETTINGS_PERMITTED_ROLES_ROLE_SELECT_MENU_CUSTOM_ID =
  'selectSettingsPermittedRolesRoleSelectMenu';
export declare const SELECT_ADD_EMOTE_PERMITTED_ROLES_ROLE_SELECT_MENU_CUSTOM_ID =
  'selectAddEmotePermittedRolesRoleSelectMenu';
export declare const ASSIGN_EMOTE_SETS_MODAL_CUSTOM_ID = 'assignEmoteSetsModal';
export declare const ASSIGN_GUILD_MODAL_CUSTOM_ID = 'assignGuildModal';
export declare const BROADCASTER_NAME_TEXT_INPUT_CUSTOM_ID = 'broadcasterNameTextInput';
export declare const SEVENTV_TEXT_INPUT_CUSTOM_ID = 'sevenTVTextInput';
export declare const GUILD_ID_TEXT_INPUT_CUSTOM_ID = 'guildIdTextInput';
export declare function buttonHandler(
  twitchClipMessageBuilders: readonly Readonly<TwitchClipMessageBuilder>[],
  emoteMessageBuilders: readonly Readonly<EmoteMessageBuilder>[],
  pingForPingMeMessageBuilders: Readonly<PingForPingMeMessageBuilder>[],
  pingForPingListMessageBuilders: Readonly<PingForPingListMessageBuilder>[],
  guild: Readonly<Guild> | undefined,
  user: Readonly<User> | undefined,
  addedEmotesDatabase: Readonly<AddedEmotesDatabase>,
  permittedRoleIdsDatabase: Readonly<PermittedRoleIdsDatabase>,
  pingsDataBase: Readonly<PingsDatabase>
): (interaction: ButtonInteraction) => Promise<EmoteMessageBuilder | undefined>;
