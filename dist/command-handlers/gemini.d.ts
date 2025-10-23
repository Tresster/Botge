/** @format */
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Guild } from '../guild.ts';
import type { ReadonlyGoogleGenAI } from '../types.ts';
export declare function geminiHandler(
  googleGenAI: ReadonlyGoogleGenAI | undefined
): (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>) => Promise<void>;
