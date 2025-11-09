/** @format */

import {
  RoleSelectMenuBuilder,
  ActionRowBuilder,
  MessageFlags,
  TextInputStyle,
  TextInputBuilder,
  ModalBuilder,
  LabelBuilder,
  type ButtonInteraction,
  type MessageActionRowComponentBuilder,
  type ModalSubmitInteraction
} from 'discord.js';

import {
  PingForPingMeMessageBuilder,
  PING_ME_AS_WELL_BUTTON_FOR_PING_ME_BASE_CUSTOM_ID,
  REMOVE_ME_FROM_PING_BUTTON_FOR_PING_ME_BASE_CUSTOM_ID,
  DELETE_PING_BUTTON_FOR_PING_ME_BASE_CUSTOM_ID
} from '../message-builders/ping-for-ping-me-message-builder.ts';
import { PingForPingListMessageBuilder } from '../message-builders/ping-for-ping-list-message-builder.ts';
import {
  getBaseCustomIdFromCustomId,
  getMessageBuilderTypeFromCustomId,
  getCounterFromCustomId,
  FIRST_BUTTON_BASE_CUSTOM_ID,
  LAST_BUTTON_BASE_CUSTOM_ID,
  PREVIOUS_BUTTON_BASE_CUSTOM_ID,
  NEXT_BUTTON_BASE_CUSTOM_ID,
  JUMP_TO_BUTTON_BASE_CUSTOM_ID
} from '../message-builders/base.ts';
import { TwitchClipMessageBuilder } from '../message-builders/twitch-clip-message-builder.ts';
import { EmoteMessageBuilder, DELETE_EMOTE_BUTTON_BASE_CUSTOM_ID } from '../message-builders/emote-message-builder.ts';
import {
  MediaMessageBuilder,
  DELETE_MEDIA_BUTTON_BASE_CUSTOM_ID,
  RENAME_MEDIA_BUTTON_BASE_CUSTOM_ID
} from '../message-builders/media-message-builder.js';
import { getSevenTvEmoteSetLinkFromSevenTvApiUlr } from '../utils/interaction-handlers/get-api-url.ts';
import { booleanToAllowed } from '../utils/boolean-to-string.ts';
import type { PermittedRoleIdsDatabase } from '../api/permitted-role-ids-database.ts';
import type { AddedEmotesDatabase } from '../api/added-emotes-database.ts';
import type { MediaDatabase } from '../api/media-database.ts';
import type { PingsDatabase } from '../api/ping-database.ts';
import {
  SETTINGS_PERMITTED_ROLES_BUTTON_CUSTOM_ID,
  ADD_EMOTE_PERMITTED_ROLES_BUTTON_CUSTOM_ID,
  ALLOW_EVERYONE_TO_ADD_EMOTE_BUTTON_CUSTOM_ID,
  ADDED_EMOTE_DELETION_MENU_BUTTON_CUSTOM_ID,
  CONFIGURATION_GUILD_BUTTON_CUSTOM_ID,
  CONFIGURATION_USER_BUTTON_CUSTOM_ID
} from '../command-handlers/settings.ts';
import type {
  TwitchClipMessageBuilderTransformFunctionReturnType,
  EmoteMessageBuilderTransformFunctionReturnType,
  MediaMessageBuilderTransformFunctionReturnType,
  PingForPingMeMessageBuilderReplies,
  PingForPingListMessageBuilderTransformFunctionReturnType
} from '../types.ts';
import { Platform } from '../enums.ts';
import type { Guild } from '../guild.ts';
import type { User } from '../user.ts';

export const SELECT_SETTINGS_PERMITTED_ROLES_ROLE_SELECT_MENU_CUSTOM_ID = 'selectSettingsPermittedRolesRoleSelectMenu';
export const SELECT_ADD_EMOTE_PERMITTED_ROLES_ROLE_SELECT_MENU_CUSTOM_ID =
  'selectAddEmotePermittedRolesRoleSelectMenu' as const;
export const ASSIGN_EMOTE_SETS_MODAL_CUSTOM_ID = 'assignEmoteSetsModal' as const;
export const ASSIGN_GUILD_MODAL_CUSTOM_ID = 'assignGuildModal' as const;

export const BROADCASTER_NAME_TEXT_INPUT_CUSTOM_ID = 'broadcasterNameTextInput' as const;
export const SEVEN_TV_TEXT_INPUT_CUSTOM_ID = 'sevenTVTextInput' as const;
export const GUILD_ID_TEXT_INPUT_CUSTOM_ID = 'guildIdTextInput' as const;

const MAX_ROLE_SELECT_MENU_VALUES = 10 as const;

const RENAME_MEDIA_MODAL_BASE_CUSTOM_ID = 'renameMediaModal' as const;
const RENAME_MEDIA_MODAL_NAME_TEXT_INPUT_CUSTOM_ID = 'renameMediaModalNameTextInput' as const;
const RENAME_MEDIA_MODAL_CUSTOM_ID_SEPARATOR = '-' as const;

let RENAME_MEDIA_MODAL_COUNTER = 0;

export function buttonHandler(
  twitchClipMessageBuilders: readonly Readonly<TwitchClipMessageBuilder>[],
  emoteMessageBuilders: readonly Readonly<EmoteMessageBuilder>[],
  mediaMessageBuilders: readonly Readonly<MediaMessageBuilder>[],
  pingForPingMeMessageBuilders: Readonly<PingForPingMeMessageBuilder>[],
  pingForPingListMessageBuilders: Readonly<PingForPingListMessageBuilder>[],
  guild: Readonly<Guild> | undefined,
  user: Readonly<User> | undefined,
  addedEmotesDatabase: Readonly<AddedEmotesDatabase>,
  permittedRoleIdsDatabase: Readonly<PermittedRoleIdsDatabase>,
  pingsDataBase: Readonly<PingsDatabase>,
  mediaDatabase: Readonly<MediaDatabase>
) {
  return async (interaction: ButtonInteraction): Promise<EmoteMessageBuilder | undefined> => {
    try {
      const { customId } = interaction;

      if (customId === CONFIGURATION_USER_BUTTON_CUSTOM_ID) {
        const GUILD_ID_TEXT_INPUT = new TextInputBuilder()
          .setCustomId(GUILD_ID_TEXT_INPUT_CUSTOM_ID)
          .setStyle(TextInputStyle.Short)
          .setRequired(true);
        if (user !== undefined) GUILD_ID_TEXT_INPUT.setValue(user.guild.id);

        const GUILD_ID_TEXT_INPUT_LABEL = new LabelBuilder()
          .setLabel('Guild ID')
          .setDescription('The ID of the Discord server where you want to get the emotes from.')
          .setTextInputComponent(GUILD_ID_TEXT_INPUT);

        const assignGuildModal = new ModalBuilder()
          .setCustomId(ASSIGN_GUILD_MODAL_CUSTOM_ID)
          .setTitle('Configuration')
          .addLabelComponents(GUILD_ID_TEXT_INPUT_LABEL);

        await interaction.showModal(assignGuildModal);
        return undefined;
      }

      if (guild === undefined) return undefined;

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
        const emotes = guild.emoteMatcher.matchSingleArray(
          '',
          Platform.sevenNotInSet,
          undefined,
          undefined,
          undefined,
          undefined,
          true
        );
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
      } else if (customId === CONFIGURATION_GUILD_BUTTON_CUSTOM_ID) {
        const BROADCASTER_NAME_TEXT_INPUT = new TextInputBuilder()
          .setCustomId(BROADCASTER_NAME_TEXT_INPUT_CUSTOM_ID)
          .setStyle(TextInputStyle.Short)
          .setRequired(false);
        const BROADCASTER_NAME_TEXT_INPUT_LABEL = new LabelBuilder()
          .setLabel('Streamer Twitch username')
          .setDescription('The Twitch username of the streamer.')
          .setTextInputComponent(BROADCASTER_NAME_TEXT_INPUT);

        const SEVEN_TV_TEXT_INPUT = new TextInputBuilder()
          .setCustomId(SEVEN_TV_TEXT_INPUT_CUSTOM_ID)
          .setStyle(TextInputStyle.Short)
          .setRequired(false);
        const SEVEN_TV_TEXT_INPUT_LABEL = new LabelBuilder()
          .setLabel('7TV Emote Set Link')
          .setDescription("The URL of the streamer's 7TV emote set.")
          .setTextInputComponent(SEVEN_TV_TEXT_INPUT);

        const ASSIGN_EMOTE_SETS_MODAL = new ModalBuilder()
          .setCustomId(ASSIGN_EMOTE_SETS_MODAL_CUSTOM_ID)
          .setTitle('Configuration')
          .addLabelComponents(BROADCASTER_NAME_TEXT_INPUT_LABEL, SEVEN_TV_TEXT_INPUT_LABEL);

        if (guild.broadcasterName !== null) BROADCASTER_NAME_TEXT_INPUT.setValue(guild.broadcasterName);

        const { personalEmoteSets } = guild.personalEmoteMatcherConstructor;
        if (personalEmoteSets !== undefined) {
          if (personalEmoteSets.sevenTv !== null)
            SEVEN_TV_TEXT_INPUT.setValue(getSevenTvEmoteSetLinkFromSevenTvApiUlr(personalEmoteSets.sevenTv));
        }

        await interaction.showModal(ASSIGN_EMOTE_SETS_MODAL);
        return undefined;
      }

      const messageBuilderType = getMessageBuilderTypeFromCustomId(customId);
      const counter = getCounterFromCustomId(customId);
      const baseCustomId = getBaseCustomIdFromCustomId(customId);
      const interactionUserId = interaction.user.id;

      if (
        messageBuilderType === PingForPingMeMessageBuilder.messageBuilderTypeForPingMe ||
        messageBuilderType === PingForPingMeMessageBuilder.messageBuilderTypeForPingList
      ) {
        const messageBuilders = (():
          | readonly Readonly<PingForPingMeMessageBuilder>[]
          | readonly Readonly<PingForPingListMessageBuilder>[]
          | undefined => {
          if (messageBuilderType === PingForPingMeMessageBuilder.messageBuilderTypeForPingMe)
            return pingForPingMeMessageBuilders;
          else return pingForPingListMessageBuilders;
        })();
        if (messageBuilders === undefined) {
          await interaction.deferUpdate();
          return undefined;
        }
        const messageBuilderIndex = messageBuilders.findIndex(
          (messageBuilder_: Readonly<PingForPingMeMessageBuilder> | Readonly<PingForPingListMessageBuilder>) =>
            messageBuilder_.counter === counter
        );
        if (messageBuilderIndex === -1) {
          await interaction.deferUpdate();
          return undefined;
        }

        const pingMessageBuilder =
          messageBuilderType === PingForPingMeMessageBuilder.messageBuilderTypeForPingMe
            ? pingForPingMeMessageBuilders[messageBuilderIndex]
            : pingForPingListMessageBuilders[messageBuilderIndex].currentPingForPingMeMessageBuilder;
        if (pingMessageBuilder === undefined) {
          await interaction.deferUpdate();
          return undefined;
        }
        const pingMessageBuilderInteraction = pingMessageBuilder.interaction;

        let pingMessageBuilderReplies: PingForPingMeMessageBuilderReplies | undefined = undefined;
        if (baseCustomId === PING_ME_AS_WELL_BUTTON_FOR_PING_ME_BASE_CUSTOM_ID) {
          pingMessageBuilderReplies = pingMessageBuilder.addUserId(pingsDataBase, interactionUserId);
        } else if (baseCustomId === REMOVE_ME_FROM_PING_BUTTON_FOR_PING_ME_BASE_CUSTOM_ID) {
          pingMessageBuilderReplies = pingMessageBuilder.removeUserId(pingsDataBase, interactionUserId);
        } else if (baseCustomId === DELETE_PING_BUTTON_FOR_PING_ME_BASE_CUSTOM_ID) {
          if (pingMessageBuilderInteraction.user.id !== interactionUserId) {
            await interaction.deferUpdate();
            return undefined;
          }

          pingMessageBuilderReplies = pingMessageBuilder.deletePing(pingsDataBase);
        } else {
          throw new Error('unknown button baseCustomId.');
        }

        const { buttonReply, reply, deletionEvent } = pingMessageBuilderReplies;
        if (buttonReply !== undefined) {
          await interaction.reply({ content: buttonReply, flags: MessageFlags.Ephemeral });
          return undefined;
        }

        await interaction.deferUpdate();
        if (reply === undefined) return undefined;
        else {
          await pingMessageBuilderInteraction.editReply(reply);

          if (deletionEvent) {
            pingMessageBuilder.cleanupPressedMapsJob.cancel();
            if (messageBuilderType === PingForPingMeMessageBuilder.messageBuilderTypeForPingMe)
              pingForPingMeMessageBuilders.splice(messageBuilderIndex, 1);
          }
        }
        return undefined;
      }

      const messageBuilders = (():
        | readonly Readonly<TwitchClipMessageBuilder>[]
        | readonly Readonly<EmoteMessageBuilder>[]
        | readonly Readonly<MediaMessageBuilder>[]
        | readonly Readonly<PingForPingListMessageBuilder>[]
        | undefined => {
        if (messageBuilderType === TwitchClipMessageBuilder.messageBuilderType) return twitchClipMessageBuilders;
        else if (messageBuilderType === EmoteMessageBuilder.messageBuilderType) return emoteMessageBuilders;
        else if (messageBuilderType === MediaMessageBuilder.messageBuilderType) return mediaMessageBuilders;
        else if (messageBuilderType === PingForPingListMessageBuilder.messageBuilderType)
          return pingForPingListMessageBuilders;
        return undefined;
      })();
      if (messageBuilders === undefined) {
        await interaction.deferUpdate();
        return undefined;
      }

      const messageBuilderIndex = messageBuilders.findIndex(
        (
          messageBuilder_:
            | Readonly<TwitchClipMessageBuilder>
            | Readonly<EmoteMessageBuilder>
            | Readonly<MediaMessageBuilder>
            | Readonly<PingForPingListMessageBuilder>
        ) => messageBuilder_.counter === counter
      );
      if (messageBuilderIndex === -1) {
        await interaction.deferUpdate();
        return undefined;
      }

      const messageBuilder = messageBuilders[messageBuilderIndex];
      const messageBuilderInteraction = messageBuilder.interaction;
      if (messageBuilderInteraction.user.id !== interactionUserId) {
        await interaction.deferUpdate();
        return undefined;
      }

      let reply:
        | EmoteMessageBuilderTransformFunctionReturnType
        | TwitchClipMessageBuilderTransformFunctionReturnType
        | MediaMessageBuilderTransformFunctionReturnType
        | PingForPingListMessageBuilderTransformFunctionReturnType
        | undefined = undefined;

      if (baseCustomId === PREVIOUS_BUTTON_BASE_CUSTOM_ID) {
        reply = messageBuilder.previous();
      } else if (baseCustomId === NEXT_BUTTON_BASE_CUSTOM_ID) {
        reply = messageBuilder.next();
      } else if (baseCustomId === FIRST_BUTTON_BASE_CUSTOM_ID) {
        reply = messageBuilder.first();
      } else if (baseCustomId === LAST_BUTTON_BASE_CUSTOM_ID) {
        reply = messageBuilder.last();
      } else if (baseCustomId === JUMP_TO_BUTTON_BASE_CUSTOM_ID) {
        // ! can't defer, when showing modal
        await interaction.showModal(messageBuilder.modal);
        return undefined;
      } else if (baseCustomId === DELETE_EMOTE_BUTTON_BASE_CUSTOM_ID) {
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
      } else if (baseCustomId === DELETE_MEDIA_BUTTON_BASE_CUSTOM_ID) {
        const messageBuilder_ = messageBuilder as Readonly<MediaMessageBuilder>;
        const { currentMedia } = messageBuilder_;

        if (currentMedia !== undefined) {
          mediaDatabase.delete(interaction.user.id, currentMedia);
          reply = messageBuilder_.markCurrentAsDeleted();
        } else {
          reply = undefined;
        }
      } else if (baseCustomId === RENAME_MEDIA_BUTTON_BASE_CUSTOM_ID) {
        const messageBuilder_ = messageBuilder as Readonly<MediaMessageBuilder>;
        const { currentMedia } = messageBuilder_;

        if (currentMedia === undefined) return undefined;
        const modalCustomId = `${RENAME_MEDIA_MODAL_BASE_CUSTOM_ID}${RENAME_MEDIA_MODAL_CUSTOM_ID_SEPARATOR}${RENAME_MEDIA_MODAL_COUNTER++}`;
        const modal = new ModalBuilder()
          .setCustomId(modalCustomId)
          .setTitle('Rename Media')
          .addLabelComponents(
            new LabelBuilder()
              .setLabel('New Name')
              .setDescription('The new name of the media.')
              .setTextInputComponent(
                new TextInputBuilder()
                  .setCustomId(RENAME_MEDIA_MODAL_NAME_TEXT_INPUT_CUSTOM_ID)
                  .setMaxLength(32)
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder('namege')
                  .setRequired(true)
              )
          );
        await interaction.showModal(modal);

        const modalSubmitInteraction = await interaction
          .awaitModalSubmit({
            filter: (modalSubmitInteraction_: ModalSubmitInteraction): boolean =>
              modalSubmitInteraction_.customId === modalCustomId,
            time: 60000
          })
          .catch(() => undefined); //timeout catch
        if (modalSubmitInteraction === undefined) return undefined;

        const userId = modalSubmitInteraction.user.id;
        const mediaName = modalSubmitInteraction.fields.getTextInputValue(RENAME_MEDIA_MODAL_NAME_TEXT_INPUT_CUSTOM_ID);
        if (mediaDatabase.mediaNameExists(userId, mediaName)) {
          await modalSubmitInteraction.reply({
            content: 'There already is a media added with this name.',
            flags: MessageFlags.Ephemeral
          });
          return undefined;
        }

        mediaDatabase.rename(userId, currentMedia.url, mediaName);
        await modalSubmitInteraction.reply({
          content: `Renamed media to ${mediaName}.`,
          flags: MessageFlags.Ephemeral
        });
        return undefined;
      } else {
        throw new Error('unknown button baseCustomId.');
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
