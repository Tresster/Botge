/** @format */

import { HarmBlockThreshold, HarmCategory } from '@google/genai';
import type { ChatInputCommandInteraction } from 'discord.js';

import type { Guild } from '../guild.ts';
import type { ReadonlyGoogleGenAI } from '../types.ts';

import { getOptionValueWithoutUndefined } from '../utils/get-option-value.ts';

const MAX_DISCORD_MESSAGE_LENGTH = 2000;

const DISCORD_EMOJIS_JOINED = ((): string | undefined => {
  const { DISCORD_EMOJIS } = process.env;
  if (DISCORD_EMOJIS === undefined) return undefined;

  return DISCORD_EMOJIS.split(',').join(' or ');
})();

export function geminiHandler(googleGenAI: ReadonlyGoogleGenAI | undefined) {
  return async (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>): Promise<void> => {
    if (googleGenAI === undefined) {
      await interaction.reply('Gemini command is not available right now.');
      return;
    }

    const defer = interaction.deferReply();
    try {
      const prompt = getOptionValueWithoutUndefined<string>(interaction, 'prompt');

      const systemInstruction = [
        'You reject the prompt if it asks for personal information.',
        'You do not mention the availability of personal information.',
        'You remove every instance of personal information in your response.'
      ];
      if (DISCORD_EMOJIS_JOINED !== undefined)
        systemInstruction.push(
          `You use ${DISCORD_EMOJIS_JOINED} frequently, but not always at the end of your sentences.`
        );

      const response = await googleGenAI.models.generateContent({
        model: 'gemini-2.5-flash-preview-05-20',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          maxOutputTokens: 400,
          candidateCount: 1,
          tools: [
            {
              googleSearch: {}
            }
          ],
          thinkingConfig: {
            includeThoughts: false, //response text cannot have thoughts
            thinkingBudget: 400 //this number is unrelated to maxOutputTokens. it is set here, so thinking will not take too much time.
          },
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE
            },
            { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE
            }
          ]
        }
      });
      const messageContent = response.text;

      if (messageContent === undefined) {
        await defer;
        await interaction.editReply('Gemini was unable to process your prompt. Try rephrasing your query.');
        return;
      }

      const reply =
        messageContent.length > MAX_DISCORD_MESSAGE_LENGTH
          ? messageContent.slice(0, MAX_DISCORD_MESSAGE_LENGTH - 5) + ' ...'
          : messageContent;
      await defer;
      await interaction.editReply(reply);
    } catch (error) {
      console.log(`Error at gemini --> ${error instanceof Error ? error.message : String(error)}`);

      await defer;
      await interaction.editReply('Failed to Gemini.');
    }
  };
}
