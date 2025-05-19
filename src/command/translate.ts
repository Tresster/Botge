import type { ChatInputCommandInteraction } from 'discord.js';

import type { ReadonlyTranslator } from '../types.js';
import type { Guild } from '../guild.js';

export function translateHandler(translator: ReadonlyTranslator | undefined) {
  return async (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>): Promise<void> => {
    if (translator === undefined) {
      void interaction.reply('translate command is not available in this server.');
      return;
    }
    const defer = interaction.deferReply();
    try {
      const text = String(interaction.options.get('text')?.value).trim();

      // Let DeepL auto-detect the source language by passing null
      const result = await translator.translateText(text, null, 'en-US', {
        modelType: 'latency_optimized',
        formality: 'prefer_less'
      });

      await defer;
      await interaction.editReply(result.text);
    } catch (error: unknown) {
      console.error(`Error at translate --> ${error instanceof Error ? error.message : String(error)}`);

      await defer;
      await interaction.editReply('Failed to translate.');
    }
  };
}
