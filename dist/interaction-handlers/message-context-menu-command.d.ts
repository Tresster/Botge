/** @format */
import type { MessageContextMenuCommandInteraction } from 'discord.js';
import type { ReadonlyOpenAI } from '../types.ts';
export declare function messageContextMenuCommandHandler(
  openai: ReadonlyOpenAI | undefined
): (interaction: MessageContextMenuCommandInteraction) => Promise<void>;
