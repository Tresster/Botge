/** @format */
import type { ChatInputCommandInteraction } from 'discord.js';
import type { ReadonlyOpenAI } from '../types.ts';
import type { Guild } from '../guild.ts';
export declare function chatgptHandler(
  openai: ReadonlyOpenAI | undefined
): (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>) => Promise<void>;
