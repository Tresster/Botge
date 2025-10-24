/** @format */

import type { ChatInputCommandInteraction } from 'discord.js';

import { getOptionValue, getOptionValueWithoutUndefined } from '../utils/get-option-value.ts';
import type { ReadonlyOpenAI, OpenAIResponseInput } from '../types.ts';
import type { Guild } from '../guild.ts';

const MAX_DISCORD_MESSAGE_LENGTH = 2000;

const DISCORD_EMOJIS_JOINED = ((): string | undefined => {
  const { DISCORD_EMOJIS } = process.env;
  if (DISCORD_EMOJIS === undefined) return undefined;

  return DISCORD_EMOJIS.split(',').join(' or ');
})();

export function chatgptHandler(openai: ReadonlyOpenAI | undefined) {
  return async (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>): Promise<void> => {
    if (openai === undefined) {
      await interaction.reply('ChatGPT command is not available right now.');
      return;
    }

    const defer = interaction.deferReply();
    try {
      const prompt = getOptionValueWithoutUndefined<string>(interaction, 'prompt');
      const image = getOptionValue<string>(interaction, 'image');
      const instructions = ((): string | undefined => {
        const instruction = getOptionValue<string>(interaction, 'instruction');

        let instructions_ = instruction ?? '';
        if (DISCORD_EMOJIS_JOINED !== undefined)
          instructions_ += ` You use ${DISCORD_EMOJIS_JOINED} frequently at the end of your sentences.`;

        return instructions_.trim();
      })();

      if (image !== undefined) {
        if (image.split(/\s+/).length !== 1) {
          await defer;
          await interaction.editReply('Please provide only one link.');
          return;
        }

        try {
          new URL(image);
        } catch {
          await defer;
          await interaction.editReply('Please provide a valid link.');
          return;
        }
      }

      //TODO: detect if img is png, jpg, webp, or non animated gif

      const input = ((): OpenAIResponseInput => {
        const inputImage: OpenAIResponseInput | undefined =
          image !== undefined
            ? [
                { role: 'user', content: prompt },
                {
                  role: 'user',
                  content: [{ type: 'input_image', image_url: image, detail: 'auto' }]
                }
              ]
            : undefined;

        return inputImage ?? [{ role: 'user', content: prompt }];
      })();

      //1 token is around 4 english characters
      const response = await openai.responses.create({
        model: 'gpt-5',
        input: input,
        max_output_tokens: 400,
        instructions: instructions ?? null,
        user: interaction.user.id
      });

      const messageContent = response.output_text;
      const reply =
        messageContent.length > MAX_DISCORD_MESSAGE_LENGTH
          ? messageContent.slice(0, MAX_DISCORD_MESSAGE_LENGTH - 5) + ' ...'
          : messageContent;
      await defer;
      await interaction.editReply(reply);
    } catch (error) {
      console.log(`Error at chatgpt --> ${error instanceof Error ? error.message : String(error)}`);

      await defer;
      await interaction.editReply('Failed to ChatGPT.');
    }
  };
}
