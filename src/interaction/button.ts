import {
  RoleSelectMenuBuilder,
  ActionRowBuilder,
  MessageFlags,
  TextInputStyle,
  TextInputBuilder,
  ModalBuilder,
  type ButtonInteraction,
  type ModalActionRowComponentBuilder,
  type MessageActionRowComponentBuilder
} from 'discord.js';

import { TwitchClipMessageBuilder } from '../message-builders/twitch-clip-message-builder.js';
import { EmoteMessageBuilder } from '../message-builders/emote-message-builder.js';
import {
  getBaseCustomIdFromCustomId,
  getMessageBuilderTypeFromCustomId,
  getCounterFromCustomId,
  FIRST_BUTTON_BASE_CUSTOM_ID,
  LAST_BUTTON_BASE_CUSTOM_ID,
  PREVIOUS_BUTTON_BASE_CUSTOM_ID,
  NEXT_BUTTON_BASE_CUSTOM_ID,
  JUMP_TO_BUTTON_BASE_CUSTOM_ID,
  DELETE_BUTTON_BASE_CUSTOM_ID
} from '../message-builders/base.js';
import {
  SETTINGS_PERMITTED_ROLES_BUTTON_CUSTOM_ID,
  ADD_EMOTE_PERMITTED_ROLES_BUTTON_CUSTOM_ID,
  ALLOW_EVERYONE_TO_ADD_EMOTE_BUTTON_CUSTOM_ID,
  ADDED_EMOTE_DELETION_MENU_BUTTON_CUSTOM_ID,
  CONFIGURATION_BUTTON_CUSTOM_ID
} from '../command/settings.js';
import type {
  TwitchClipMessageBuilderTransformFunctionReturnType,
  EmoteMessageBuilderTransformFunctionReturnType
} from '../types.js';
import type { Guild } from '../guild.js';
import { booleanToAllowed } from '../utils/boolean-to-string.js';
import type { PermittedRoleIdsDatabase } from '../api/permitted-role-ids-database.js';
import type { AddedEmotesDatabase } from '../api/added-emotes-database.js';
import { Platform } from '../enums.js';
import { getSevenTvEmoteSetLinkFromSevenTvApiUlr } from '../utils/get-api-url.js';

export const SELECT_SETTINGS_PERMITTED_ROLES_ROLE_SELECT_MENU_CUSTOM_ID = 'selectSettingsPermittedRolesRoleSelectMenu';
export const SELECT_ADD_EMOTE_PERMITTED_ROLES_ROLE_SELECT_MENU_CUSTOM_ID = 'selectAddEmotePermittedRolesRoleSelectMenu';
export const ASSIGN_EMOTE_SETS_MODAL_CUSTOM_ID = 'assignEmoteSetsModal';

export const BROADCASTER_NAME_TEXT_INPUT_CUSTOM_ID = 'broadcasterNameTextInput';
export const SEVENTV_TEXT_INPUT_CUSTOM_ID = 'sevenTVTextInput';

const BROADCASTER_NAME_TEXT_INPUT = new TextInputBuilder()
  .setCustomId(BROADCASTER_NAME_TEXT_INPUT_CUSTOM_ID)
  .setLabel('Streamer Twitch username')
  .setStyle(TextInputStyle.Short)
  .setRequired(false);
const SEVENTV_TEXT_INPUT = new TextInputBuilder()
  .setCustomId(SEVENTV_TEXT_INPUT_CUSTOM_ID)
  .setLabel('7TV Emote Set Link')
  .setStyle(TextInputStyle.Short)
  .setRequired(false);

const BROADCASTER_NAME_ACTION_ROW = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
  BROADCASTER_NAME_TEXT_INPUT
);
const SEVENTV_ACTION_ROW = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(SEVENTV_TEXT_INPUT);

const ASSIGN_EMOTE_SETS_MODAL = new ModalBuilder()
  .setCustomId(ASSIGN_EMOTE_SETS_MODAL_CUSTOM_ID)
  .setTitle('Configuration')
  .addComponents(BROADCASTER_NAME_ACTION_ROW, SEVENTV_ACTION_ROW);

const MAX_ROLE_SELECT_MENU_VALUES = 10;

export function buttonHandler(
  twitchClipMessageBuilders: readonly Readonly<TwitchClipMessageBuilder>[],
  emoteMessageBuilders: readonly Readonly<EmoteMessageBuilder>[],
  guild: Readonly<Guild>,
  addedEmotesDatabase: Readonly<AddedEmotesDatabase>,
  permittedRoleIdsDatabase: Readonly<PermittedRoleIdsDatabase>
) {
  return async (interaction: ButtonInteraction): Promise<EmoteMessageBuilder | undefined> => {
    try {
      const { customId } = interaction;

      if (
        customId === SETTINGS_PERMITTED_ROLES_BUTTON_CUSTOM_ID ||
        customId === ADD_EMOTE_PERMITTED_ROLES_BUTTON_CUSTOM_ID
      ) {
        const defer = interaction.deferReply({ flags: MessageFlags.Ephemeral });

        let permittedRoles = guild.settingsPermittedRoleIds;
        let roleSelectMenuCustomId = SELECT_SETTINGS_PERMITTED_ROLES_ROLE_SELECT_MENU_CUSTOM_ID;
        let commandName = 'settings';

        if (customId === ADD_EMOTE_PERMITTED_ROLES_BUTTON_CUSTOM_ID) {
          permittedRoles = guild.addEmotePermittedRoleIds;
          roleSelectMenuCustomId = SELECT_ADD_EMOTE_PERMITTED_ROLES_ROLE_SELECT_MENU_CUSTOM_ID;
          commandName = 'addemote';
        }

        const roleSelectMenuBuilder = new RoleSelectMenuBuilder()
          .setCustomId(roleSelectMenuCustomId)
          .setPlaceholder('Select roles')
          .setMinValues(0)
          .setMaxValues(MAX_ROLE_SELECT_MENU_VALUES);
        if (permittedRoles !== null) roleSelectMenuBuilder.setDefaultRoles([...permittedRoles]);

        const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(roleSelectMenuBuilder);

        await defer;
        await interaction.editReply({
          content: `Select roles which are able to use the ${commandName} command.`,
          components: [row]
        });
        return undefined;
      } else if (customId === ALLOW_EVERYONE_TO_ADD_EMOTE_BUTTON_CUSTOM_ID) {
        const defer = interaction.deferReply({ flags: MessageFlags.Ephemeral });

        guild.toggleAllowEveryoneToAddEmote();
        const { allowEveryoneToAddEmote } = guild;
        permittedRoleIdsDatabase.changeAllowEveryoneToAddEmote(guild.id, allowEveryoneToAddEmote);

        await defer;
        await interaction.editReply(
          `Everyone is ${booleanToAllowed(allowEveryoneToAddEmote)} to use add emote command now.`
        );
        return undefined;
      } else if (customId === ADDED_EMOTE_DELETION_MENU_BUTTON_CUSTOM_ID) {
        const defer = interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const emotes = guild.emoteMatcher.matchSingleArray('', Platform.sevenNotInSet);
        if (emotes === undefined) {
          await defer;
          await interaction.editReply('No emotes have been added to this server yet.');
          return undefined;
        }

        const emoteMessageBuilder = new EmoteMessageBuilder(interaction, emotes, undefined, true);
        const reply = emoteMessageBuilder.first();

        await defer;
        if (reply === undefined) return undefined;
        await interaction.editReply(reply);
        return emoteMessageBuilder;
      } else if (customId === CONFIGURATION_BUTTON_CUSTOM_ID) {
        if (guild.broadcasterName !== null) BROADCASTER_NAME_TEXT_INPUT.setValue(guild.broadcasterName);

        const { personalEmoteSets } = guild.personalEmoteMatcherConstructor;
        if (personalEmoteSets !== undefined && personalEmoteSets.sevenTv !== null)
          SEVENTV_TEXT_INPUT.setValue(getSevenTvEmoteSetLinkFromSevenTvApiUlr(personalEmoteSets.sevenTv));

        await interaction.showModal(ASSIGN_EMOTE_SETS_MODAL);
        return undefined;
      }

      const messageBuilders = (():
        | readonly Readonly<TwitchClipMessageBuilder>[]
        | readonly Readonly<EmoteMessageBuilder>[]
        | undefined => {
        const messageBuilderType = getMessageBuilderTypeFromCustomId(customId);

        if (messageBuilderType === TwitchClipMessageBuilder.messageBuilderType) return twitchClipMessageBuilders;
        else if (messageBuilderType === EmoteMessageBuilder.messageBuilderType) return emoteMessageBuilders;
        return undefined;
      })();
      if (messageBuilders === undefined) return undefined;

      const counter = getCounterFromCustomId(customId);
      const messageBuilderIndex = messageBuilders.findIndex(
        (messageBuilder: Readonly<TwitchClipMessageBuilder> | Readonly<EmoteMessageBuilder>) =>
          messageBuilder.counter === counter
      );
      if (messageBuilderIndex === -1) return undefined;

      const messageBuilder = messageBuilders[messageBuilderIndex];
      const messageBuilderInteraction = messageBuilder.interaction;
      if (messageBuilderInteraction.user.id !== interaction.user.id) return undefined;

      let reply:
        | EmoteMessageBuilderTransformFunctionReturnType
        | TwitchClipMessageBuilderTransformFunctionReturnType
        | undefined = undefined;
      const baseCustomId = getBaseCustomIdFromCustomId(customId);
      if (baseCustomId === PREVIOUS_BUTTON_BASE_CUSTOM_ID) {
        reply = messageBuilder.previous();
      } else if (baseCustomId === NEXT_BUTTON_BASE_CUSTOM_ID) {
        reply = messageBuilder.next();
      } else if (baseCustomId === FIRST_BUTTON_BASE_CUSTOM_ID) {
        reply = messageBuilder.first();
      } else if (baseCustomId === LAST_BUTTON_BASE_CUSTOM_ID) {
        reply = messageBuilder.last();
      } else if (baseCustomId === JUMP_TO_BUTTON_BASE_CUSTOM_ID) {
        //can't defer, when showing modal
        await interaction.showModal(messageBuilder.modal);
        return undefined;
      } else if (baseCustomId === DELETE_BUTTON_BASE_CUSTOM_ID) {
        const messageBuilder_ = messageBuilder as Readonly<EmoteMessageBuilder>;
        const { currentAddedEmote } = messageBuilder_;

        if (currentAddedEmote !== undefined) {
          addedEmotesDatabase.delete(currentAddedEmote, guild.id);
          guild.personalEmoteMatcherConstructor.removeSevenTVEmoteNotInSet(currentAddedEmote);
          await guild.refreshEmoteMatcher();
          reply = messageBuilder_.markCurrentAsDeleted();
        } else {
          reply = undefined;
        }
      }

      await interaction.deferUpdate();
      if (reply === undefined) return undefined;
      await messageBuilderInteraction.editReply(reply);
      return undefined;
    } catch (error) {
      console.log(`Error at button --> ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  };
}
