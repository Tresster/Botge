import { MessageFlags, type ModalSubmitInteraction } from 'discord.js';

import {
  getSevenTvApiUrlFromSevenTvEmoteSetLink,
  getBttvApiUrlFromBroadcasterName,
  getFfzApiUrlFromBroadcasterName
} from '../utils/interaction-handlers/get-api-url.ts';
import { PingForPingListMessageBuilder } from '../message-builders/ping-for-ping-list-message-builder.ts';
import { TwitchClipMessageBuilder } from '../message-builders/twitch-clip-message-builder.ts';
import { EmoteMessageBuilder } from '../message-builders/emote-message-builder.ts';
import {
  getBaseCustomIdFromCustomId,
  getMessageBuilderTypeFromCustomId,
  getCounterFromCustomId,
  getCustomId,
  JUMP_TO_MODAL_BASE_CUSTOM_ID,
  JUMP_TO_TEXT_INPUT_BASE_CUSTOM_ID,
  JUMP_TO_IDENTIFIER_INPUT_BASE_CUSTOM_ID
} from '../message-builders/base.ts';
import type { BroadcasterNameAndPersonalEmoteSetsDatabase } from '../api/broadcaster-name-and-personal-emote-sets-database.ts';
import type { TwitchApi } from '../api/twitch-api.ts';
import type { UsersDatabase } from '../api/user.js';
import {
  ASSIGN_EMOTE_SETS_MODAL_CUSTOM_ID,
  BROADCASTER_NAME_TEXT_INPUT_CUSTOM_ID,
  SEVENTV_TEXT_INPUT_CUSTOM_ID,
  ASSIGN_GUILD_MODAL_CUSTOM_ID,
  GUILD_ID_TEXT_INPUT_CUSTOM_ID
} from './button.ts';
import { PersonalEmoteSets } from '../personal-emote-sets.ts';
import type { Guild } from '../guild.ts';
import { User } from '../user.js';

export function modalSubmitHandler(
  twitchClipMessageBuilders: readonly Readonly<TwitchClipMessageBuilder>[],
  emoteMessageBuilders: readonly Readonly<EmoteMessageBuilder>[],
  pingForPingListMessageBuilders: readonly Readonly<PingForPingListMessageBuilder>[],
  guild: Readonly<Guild> | undefined,
  broadcasterNameAndPersonalEmoteSetsDatabase: Readonly<BroadcasterNameAndPersonalEmoteSetsDatabase>,
  usersDatabase: Readonly<UsersDatabase>,
  twitchApi: Readonly<TwitchApi> | undefined,
  guilds: readonly Readonly<Guild>[],
  users: Readonly<User>[]
) {
  return async (interaction: ModalSubmitInteraction): Promise<void> => {
    const { customId } = interaction;
    const deferReply =
      customId === ASSIGN_EMOTE_SETS_MODAL_CUSTOM_ID || customId === ASSIGN_GUILD_MODAL_CUSTOM_ID
        ? interaction.deferReply({ flags: MessageFlags.Ephemeral })
        : undefined;

    try {
      if (customId === ASSIGN_GUILD_MODAL_CUSTOM_ID) {
        const guildId = interaction.fields.getTextInputValue(GUILD_ID_TEXT_INPUT_CUSTOM_ID).trim();
        const userId = interaction.user.id;

        const guild_ = guilds.find((guildge) => guildge.id === guildId);
        if (guild_ === undefined) {
          await deferReply;
          await interaction.editReply('There is no server with this ID in the database. Previous settings unchanged.');
          return;
        }

        let user = users.find((user_) => user_.id === userId);
        if (user !== undefined) {
          await deferReply;
          if (user.guild.id === guildId) {
            await interaction.editReply('Nothing changed.');
          } else {
            usersDatabase.changeGuildId(userId, guildId);
            user.changeGuild(guild_);
            await interaction.editReply('Changed guild.');
          }
          return;
        }

        user = new User(userId, guild_);
        users.push(user);
        usersDatabase.changeGuildId(userId, guildId);
        await deferReply;
        await interaction.editReply('Changed guild.');
        return;
      }

      if (guild === undefined) return;

      if (customId === ASSIGN_EMOTE_SETS_MODAL_CUSTOM_ID) {
        const { id } = guild;

        let broadcasterName: string | null = interaction.fields
          .getTextInputValue(BROADCASTER_NAME_TEXT_INPUT_CUSTOM_ID)
          .trim();
        let sevenTv: string | null = interaction.fields.getTextInputValue(SEVENTV_TEXT_INPUT_CUSTOM_ID).trim();
        let bttv: string | null = null;
        let ffz: string | null = null;
        let reply = '';

        if (broadcasterName === '') broadcasterName = null;
        if (sevenTv === '') sevenTv = null;
        else {
          const sevenTvApiUrlMessage = await getSevenTvApiUrlFromSevenTvEmoteSetLink(sevenTv);
          const { type } = sevenTvApiUrlMessage;

          if (type === 'success') {
            const { ownerUsername } = sevenTvApiUrlMessage;

            if (
              broadcasterName !== null &&
              ownerUsername !== undefined &&
              broadcasterName.toLowerCase() !== ownerUsername.toLowerCase()
            ) {
              await deferReply;
              await interaction.editReply('Broadcaster name and 7TV emote set owner does not match.');
              return;
            }

            sevenTv = sevenTvApiUrlMessage.url;
          } else if (type === 'feedback') {
            reply += sevenTvApiUrlMessage.message;
          } else {
            await deferReply;
            await interaction.editReply(sevenTvApiUrlMessage.message);
            return;
          }
        }

        if (broadcasterName !== null) {
          const bttvApiUrlMessage = await getBttvApiUrlFromBroadcasterName(broadcasterName, twitchApi);
          const bttvApiUrlMessageType = bttvApiUrlMessage.type;

          if (bttvApiUrlMessageType === 'success') {
            bttv = bttvApiUrlMessage.url;
          } else if (bttvApiUrlMessageType === 'feedback') {
            reply += `\n${bttvApiUrlMessage.message}`;
          } else {
            await deferReply;
            await interaction.editReply(bttvApiUrlMessage.message);
            return;
          }

          const ffzApiUrlMessage = await getFfzApiUrlFromBroadcasterName(broadcasterName);
          const ffzApiUrlMessageType = ffzApiUrlMessage.type;

          if (ffzApiUrlMessageType === 'success') {
            ffz = ffzApiUrlMessage.url;
          } else if (ffzApiUrlMessageType === 'feedback') {
            reply += `\n${ffzApiUrlMessage.message}`;
          } else {
            await deferReply;
            await interaction.editReply(ffzApiUrlMessage.message);
            return;
          }
        }

        if (broadcasterName !== null && guild.broadcasterName !== broadcasterName) {
          await guild.changeBroadcasterNameAndRefreshClips(twitchApi, broadcasterName);
          broadcasterNameAndPersonalEmoteSetsDatabase.changeBroadcasterName(id, broadcasterName);

          reply += '\nRefreshed clips based on broadcaster name.';
        }

        if (sevenTv !== null || bttv !== null || ffz !== null) {
          const oldPersonalEmoteSets = guild.personalEmoteMatcherConstructor.personalEmoteSets;
          const personalEmoteSets = new PersonalEmoteSets(sevenTv, bttv, ffz);
          await guild.changePersonalEmoteSetsAndRefreshEmoteMatcher(personalEmoteSets);
          broadcasterNameAndPersonalEmoteSetsDatabase.changePersonalEmoteSets(id, personalEmoteSets);

          if (
            (sevenTv !== null && oldPersonalEmoteSets !== undefined && oldPersonalEmoteSets.sevenTv !== sevenTv) ||
            (oldPersonalEmoteSets === undefined && sevenTv !== null)
          )
            reply += '\nChanged 7TV Emote set.';

          if (
            (bttv !== null && oldPersonalEmoteSets !== undefined && oldPersonalEmoteSets.bttv !== bttv) ||
            (oldPersonalEmoteSets === undefined && bttv !== null)
          )
            reply += '\nFound BTTV Emote set from broadcaster name and changed to it.';

          if (
            (ffz !== null && oldPersonalEmoteSets !== undefined && oldPersonalEmoteSets.ffz !== ffz) ||
            (oldPersonalEmoteSets === undefined && ffz !== null)
          )
            reply += '\nFound FFZ Emote set from broadcaster name and changed to it.';
        }

        reply = reply.trim();
        reply = reply === '' ? 'Nothing changed.' : reply;
        await deferReply;
        await interaction.editReply(reply);
        return;
      }

      const messageBuilderType = getMessageBuilderTypeFromCustomId(customId);
      const messageBuilders = (():
        | readonly Readonly<TwitchClipMessageBuilder>[]
        | readonly Readonly<EmoteMessageBuilder>[]
        | readonly Readonly<PingForPingListMessageBuilder>[]
        | undefined => {
        if (messageBuilderType === TwitchClipMessageBuilder.messageBuilderType) return twitchClipMessageBuilders;
        else if (messageBuilderType === EmoteMessageBuilder.messageBuilderType) return emoteMessageBuilders;
        else if (messageBuilderType === PingForPingListMessageBuilder.messageBuilderType)
          return pingForPingListMessageBuilders;
        return undefined;
      })();
      if (messageBuilders === undefined) return;

      const counter = getCounterFromCustomId(customId);
      const messageBuilderIndex = messageBuilders.findIndex(
        (
          messageBuilder:
            | Readonly<TwitchClipMessageBuilder>
            | Readonly<EmoteMessageBuilder>
            | Readonly<PingForPingListMessageBuilder>
        ) => messageBuilder.counter === counter
      );
      if (messageBuilderIndex === -1) return;

      const messageBuilder = messageBuilders[messageBuilderIndex];
      const messageBuilderInteraction = messageBuilder.interaction;

      const defer = interaction.deferUpdate();
      const baseCustomId = getBaseCustomIdFromCustomId(customId);
      if (baseCustomId !== JUMP_TO_MODAL_BASE_CUSTOM_ID) return;

      const jumpToTextInputValue = interaction.fields
        .getTextInputValue(getCustomId(JUMP_TO_TEXT_INPUT_BASE_CUSTOM_ID, messageBuilderType, messageBuilder.counter))
        .trim();

      let jumpToIdentifierTextInputValue: string | undefined = undefined;
      try {
        jumpToIdentifierTextInputValue = interaction.fields
          .getTextInputValue(
            getCustomId(JUMP_TO_IDENTIFIER_INPUT_BASE_CUSTOM_ID, messageBuilderType, messageBuilder.counter)
          )
          .trim();
      } catch {}

      if (
        jumpToTextInputValue !== '' &&
        jumpToIdentifierTextInputValue !== undefined &&
        jumpToIdentifierTextInputValue !== ''
      ) {
        //can't set both
        await defer;
        return;
      }

      if (jumpToIdentifierTextInputValue !== undefined && jumpToIdentifierTextInputValue !== '') {
        const reply = messageBuilder.jumpToIdentifer(jumpToIdentifierTextInputValue);
        await defer;

        if (reply === undefined) return;
        await messageBuilderInteraction.editReply(reply);
        return;
      }

      if (jumpToTextInputValue === '') {
        const reply = messageBuilder.random();
        await defer;

        if (reply === undefined) return;
        await messageBuilderInteraction.editReply(reply);
        return;
      }

      const jumpToTextIntputValueNumber = Number(jumpToTextInputValue);
      if (Number.isNaN(jumpToTextIntputValueNumber)) {
        await defer;
        return;
      }

      const reply = messageBuilder.jumpTo(jumpToTextIntputValueNumber - 1);
      await defer;

      if (reply === undefined) return;
      await messageBuilderInteraction.editReply(reply);
    } catch (error) {
      console.log(`Error at modalSubmit --> ${error instanceof Error ? error.message : String(error)}`);
      if (deferReply !== undefined) {
        await deferReply;
        await interaction.editReply('Something went wrong. Please try again later.');
      }
    }
  };
}
