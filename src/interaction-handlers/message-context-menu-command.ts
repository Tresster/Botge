import type { MessageContextMenuCommandInteraction } from 'discord.js';

import type { ReadonlyOpenAI } from '../types.ts';

const MAX_DISCORD_MESSAGE_LENGTH = 2000;

const DISCORD_EMOJIS_JOINED = ((): string | undefined => {
  const { DISCORD_EMOJIS } = process.env;
  if (DISCORD_EMOJIS === undefined) return undefined;

  return DISCORD_EMOJIS.split(',').join(' or ');
})();

export function messageContextMenuCommandHandler(openai: ReadonlyOpenAI | undefined) {
  return async (interaction: MessageContextMenuCommandInteraction): Promise<void> => {
    if (openai === undefined) {
      await interaction.reply('ChatGPT command is not available right now.');
      return;
    }

    const defer = interaction.deferReply();
    try {
      const { content } = interaction.targetMessage;
      const instructions = ((): string => {
        let instruction = 'Be concise.';

        if (DISCORD_EMOJIS_JOINED !== undefined)
          instruction += ` You use ${DISCORD_EMOJIS_JOINED} frequently at the end of your sentences.`;

        return instruction;
      })();

      const response = await openai.responses.create({
        model: 'gpt-4.1',
        input: `Explain "${content}".`,
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
    } catch (error) {
      console.log(`Error at contextMenuCommand --> ${error instanceof Error ? error.message : String(error)}`);

      await defer;
      await interaction.editReply('Failed to provide output.');
    }
  };
}
