import { MessageFlags, type ChatInputCommandInteraction } from 'discord.js';

import { getOptionValue } from '../utils/get-option-value.ts';
import type { Guild } from '../guild.ts';

async function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}

const MAXIMUM_DURATION_SECONDS = 600;

export function transientHandler() {
  return async function transientHandlerInnerFunction(
    interaction: ChatInputCommandInteraction,
    guild: Readonly<Guild>
  ): Promise<undefined> {
    try {
      const attachment = interaction.options.get('attachment')?.attachment;
      const text = getOptionValue<string>(interaction, 'text');
      const duration = getOptionValue<number>(interaction, 'duration') ?? 3;

      if (text !== undefined && attachment !== undefined) {
        await interaction.reply({
          content: 'Please only provide either attachment or text.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      if (text === undefined && attachment === undefined) {
        await interaction.reply({
          content: 'Please provide either attachment or text.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      if (duration < 0 || duration > MAXIMUM_DURATION_SECONDS) {
        await interaction.reply({
          content: `Please provide a duration between 0 and ${MAXIMUM_DURATION_SECONDS}.`,
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      let reply = text;
      if (attachment !== undefined) reply = attachment.url;
      if (reply === undefined) throw new Error('Either text or attachment must have been not undefined.');

      await interaction.reply(reply);
      await sleep(duration);
      await interaction.deleteReply();
    } catch (error: unknown) {
      console.log(`Error at transientHandler --> ${error instanceof Error ? error.message : String(error)}`);
    }
  };
}
