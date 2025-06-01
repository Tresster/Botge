import {
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
  type MessageActionRowComponentBuilder,
  type GuildMember,
  type Role
} from 'discord.js';

import { permitted, administrator, owner, globalAdministrator } from '../utils/command/permitted.ts';
import { booleanToAllowed } from '../utils/boolean-to-string.ts';
import type { Guild } from '../guild.ts';

export const SETTINGS_PERMITTED_ROLES_BUTTON_CUSTOM_ID = 'settingsPermittedRolesButton';
export const ADD_EMOTE_PERMITTED_ROLES_BUTTON_CUSTOM_ID = 'addEmotePermittedRolesButton';
export const ALLOW_EVERYONE_TO_ADD_EMOTE_BUTTON_CUSTOM_ID = 'allowEveryoneToAddEmoteButton';
export const ADDED_EMOTE_DELETION_MENU_BUTTON_CUSTOM_ID = 'addedEmoteDeletionMenuButton';
export const CONFIGURATION_BUTTON_CUSTOM_ID = 'configurationButton';

export function settingsHandler() {
  return async (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>): Promise<void> => {
    const defer = interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      const { member } = interaction;
      const interactionGuild = interaction.guild;
      if (interactionGuild === null || member === null) return;

      const member_ = member as GuildMember;
      const memberRolesCache: readonly (readonly [string, Role])[] = [...member_.roles.cache];
      const owner_ = owner(member_, interactionGuild);
      const globalAdministrator_ = globalAdministrator(member_);
      if (!permitted(memberRolesCache, guild.settingsPermittedRoleIds) && !owner_ && !globalAdministrator_) {
        await defer;
        await interaction.editReply('You do not have the necessary permissions to use this command.');
        return;
      }

      const row = new ActionRowBuilder<MessageActionRowComponentBuilder>();
      if (administrator(memberRolesCache) || owner_ || globalAdministrator_) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(CONFIGURATION_BUTTON_CUSTOM_ID)
            .setLabel('Configuration')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(SETTINGS_PERMITTED_ROLES_BUTTON_CUSTOM_ID)
            .setLabel('Settings permitted roles')
            .setStyle(ButtonStyle.Success)
        );
      }

      row.addComponents(
        new ButtonBuilder()
          .setCustomId(ADD_EMOTE_PERMITTED_ROLES_BUTTON_CUSTOM_ID)
          .setLabel('Add emote permitted roles')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(ALLOW_EVERYONE_TO_ADD_EMOTE_BUTTON_CUSTOM_ID)
          .setLabel(`Allow everyone to add emote (Currently: ${booleanToAllowed(guild.allowEveryoneToAddEmote)})`)
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(ADDED_EMOTE_DELETION_MENU_BUTTON_CUSTOM_ID)
          .setLabel('Added emote deletion menu')
          .setStyle(ButtonStyle.Danger)
      );

      await defer;
      await interaction.editReply({ components: [row] });
    } catch (error) {
      console.log(`Error at settings --> ${error instanceof Error ? error.message : String(error)}`);

      await defer;
      await interaction.editReply('Failed to output settings.');
    }
  };
}
