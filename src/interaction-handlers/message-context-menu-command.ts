/** @format */

import {
  ModalBuilder,
  LabelBuilder,
  TextInputBuilder,
  TextInputStyle,
  TextDisplayBuilder,
  MessageFlags,
  type Message,
  type ModalSubmitInteraction,
  type MessageContextMenuCommandInteraction
} from 'discord.js';

import type {
  Media,
  ReadonlyOpenAI,
  ReadonlyEmbed,
  ReadonlyAttachment,
  OpenAIResponseInput,
  OpenAIResponseInputImage
} from '../types.ts';
import type { MediaDatabase } from '../api/media-database.ts';
import { CONTEXT_MENU_COMMAND_NAMES } from '../commands.ts';

const MAX_DISCORD_MESSAGE_LENGTH = 2000 as const;

const DISCORD_EMOJIS_JOINED = ((): string | undefined => {
  const { DISCORD_EMOJIS } = process.env;
  if (DISCORD_EMOJIS === undefined) return undefined;

  return DISCORD_EMOJIS.split(',').join(' or ');
})();

const ADD_MEDIA_MODAL_BASE_CUSTOM_ID = 'addMediaModal' as const;
const ADD_MEDIA_MODAL_NAME_TEXT_INPUT_CUSTOM_ID = 'addMediaModalNameTextInput' as const;
const REMOVE_MEDIA_MODAL_BASE_CUSTOM_ID = 'removeMediaModal' as const;
const MODAL_CUSTOM_ID_SEPARATOR = '-' as const;

let ADD_MEDIA_MODAL_COUNTER = 0;
let REMOVE_MEDIA_MODAL_COUNTER = 0;

type getMediaUrlFromMessageReturnType =
  | { readonly type: 'success'; readonly mediaUrl: string }
  | { readonly type: 'feedback'; readonly message: string };

function getMediaUrlFromMessage(message: Message): getMediaUrlFromMessageReturnType {
  const { embeds } = message;
  const { attachments } = message;

  if (embeds.length === 0) {
    if (attachments.size === 0) {
      return { type: 'feedback', message: 'There are no embeds/attachments in the target message.' };
    }
  }

  if (embeds.length !== 1) {
    if (attachments.size === 0)
      return { type: 'feedback', message: 'There are no embeds/attachments in the target message.' };
    else if (attachments.size > 1)
      return { type: 'feedback', message: 'Target message has more than one embeds/attachments.' };

    const attachmentUrl = attachments.at(0)?.url;
    if (attachmentUrl === undefined)
      return { type: 'feedback', message: 'Something went wrong. Please try again later.' };

    return { type: 'success', mediaUrl: attachmentUrl };
  } else {
    const embedUrl = embeds[0].url;

    if (embedUrl === null) return { type: 'feedback', message: "Target message's url is empty." };

    if (
      !embedUrl.startsWith('https://tenor.com/view/') &&
      !embedUrl.startsWith('https://cdn.discordapp.com/attachments/')
    ) {
      return { type: 'feedback', message: 'Currently the only supported media are Tenor links and attachments.' };
    }

    return { type: 'success', mediaUrl: embedUrl };
  }
}

export function messageContextMenuCommandHandler(
  openai: ReadonlyOpenAI | undefined,
  mediaDatabase: Readonly<MediaDatabase>
) {
  return async (interaction: MessageContextMenuCommandInteraction): Promise<void> => {
    if (openai === undefined) {
      await interaction.reply('ChatGPT command is not available right now.');
      return;
    }

    const defer =
      interaction.commandName !== CONTEXT_MENU_COMMAND_NAMES.addMedia &&
      interaction.commandName !== CONTEXT_MENU_COMMAND_NAMES.removeMedia
        ? interaction.deferReply()
        : undefined;
    try {
      if (interaction.commandName === CONTEXT_MENU_COMMAND_NAMES.chatGptExplain) {
        const { content } = interaction.targetMessage;
        const instructions = ((): string => {
          let instruction = 'Be concise.';

          if (DISCORD_EMOJIS_JOINED !== undefined)
            instruction += ` You use ${DISCORD_EMOJIS_JOINED} frequently at the end of your sentences.`;

          return instruction;
        })();

        const input = ((): OpenAIResponseInput => {
          const inputText = ((): string => {
            const content_ = content !== '' ? `"${content}"` : '';
            return `Explain ${content_}`;
          })();

          const inputImages = ((): OpenAIResponseInput | undefined => {
            const { embeds, attachments } = interaction.targetMessage;

            const embeds_ = embeds.map((embed: ReadonlyEmbed) => embed.url).filter((embedUrl) => embedUrl !== null);
            const imageUrls =
              embeds_.length > 0 ? embeds_ : attachments.map((attachment: ReadonlyAttachment) => attachment.url);
            const images: OpenAIResponseInputImage[] = imageUrls.map((imageUrl) => ({
              type: 'input_image',
              image_url: imageUrl,
              detail: 'low'
            }));

            return images.length > 0
              ? [
                  { role: 'user', content: inputText },
                  {
                    role: 'user',
                    content: images
                  }
                ]
              : undefined;
          })();

          return inputImages ?? [{ role: 'user', content: inputText }];
        })();

        const response = await openai.responses.create({
          model: 'gpt-4.1',
          input: input,
          max_output_tokens: 400,
          instructions: instructions,
          user: interaction.user.id
        });

        const messageContent = response.output_text;
        const reply =
          messageContent.length > MAX_DISCORD_MESSAGE_LENGTH
            ? messageContent.slice(0, MAX_DISCORD_MESSAGE_LENGTH - 5) + ' ...'
            : messageContent;
        await defer;
        await interaction.editReply(reply);
      } else if (interaction.commandName === CONTEXT_MENU_COMMAND_NAMES.addMedia) {
        const getMediaUrlFromMessage_ = getMediaUrlFromMessage(interaction.targetMessage);

        if (getMediaUrlFromMessage_.type === 'feedback') {
          await interaction.reply({
            content: getMediaUrlFromMessage_.message,
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        const userId = interaction.user.id;
        const { mediaUrl } = getMediaUrlFromMessage_;
        if (mediaDatabase.mediaUrlExists(userId, mediaUrl)) {
          await interaction.reply({
            content: 'There already is a media added with this link.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        const modalCustomId = `${ADD_MEDIA_MODAL_BASE_CUSTOM_ID}${MODAL_CUSTOM_ID_SEPARATOR}${ADD_MEDIA_MODAL_COUNTER++}`;
        const modal = new ModalBuilder()
          .setCustomId(modalCustomId)
          .setTitle('Add Media')
          .addLabelComponents(
            new LabelBuilder()
              .setLabel('Name')
              .setDescription('The name of the media.')
              .setTextInputComponent(
                new TextInputBuilder()
                  .setCustomId(ADD_MEDIA_MODAL_NAME_TEXT_INPUT_CUSTOM_ID)
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
        if (modalSubmitInteraction === undefined) return;

        const mediaName = modalSubmitInteraction.fields.getTextInputValue(ADD_MEDIA_MODAL_NAME_TEXT_INPUT_CUSTOM_ID);
        if (mediaDatabase.mediaNameExists(userId, mediaName)) {
          await modalSubmitInteraction.reply({
            content: 'There already is a media added with this name.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        const media: Media = { url: mediaUrl, name: mediaName, dateAdded: new Date(Date.now()) };
        mediaDatabase.insert(userId, media);
        await modalSubmitInteraction.reply({
          content: `Added media with the name ${mediaName}.`,
          flags: MessageFlags.Ephemeral
        });
      } else if (interaction.commandName === CONTEXT_MENU_COMMAND_NAMES.removeMedia) {
        const getMediaUrlFromMessage_ = getMediaUrlFromMessage(interaction.targetMessage);

        if (getMediaUrlFromMessage_.type === 'feedback') {
          await interaction.reply({
            content: getMediaUrlFromMessage_.message,
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        const userId = interaction.user.id;
        const { mediaUrl } = getMediaUrlFromMessage_;
        const mediaName = mediaDatabase.getMediaName(userId, mediaUrl);
        if (mediaName === undefined) {
          await interaction.reply({
            content: 'You do not have a media added with this link.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        const modalCustomId = `${REMOVE_MEDIA_MODAL_BASE_CUSTOM_ID}${MODAL_CUSTOM_ID_SEPARATOR}${REMOVE_MEDIA_MODAL_COUNTER++}`;
        const modal = new ModalBuilder()
          .setCustomId(modalCustomId)
          .setTitle('Are you sure?')
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(`You are about to delete '${mediaName}'.`));
        await interaction.showModal(modal);

        const modalSubmitInteraction = await interaction
          .awaitModalSubmit({
            filter: (modalSubmitInteraction_: ModalSubmitInteraction): boolean =>
              modalSubmitInteraction_.customId === modalCustomId,
            time: 30000
          })
          .catch(() => undefined); //timeout catch
        if (modalSubmitInteraction === undefined) return;

        mediaDatabase.delete(userId, { name: mediaName, url: mediaUrl });
        await modalSubmitInteraction.reply({ content: `Removed media ${mediaName}.`, flags: MessageFlags.Ephemeral });
      }
    } catch (error) {
      console.log(`Error at contextMenuCommand --> ${error instanceof Error ? error.stack : String(error)}`);

      await defer;
      await interaction.editReply('Failed to provide output.');
    }
  };
}
