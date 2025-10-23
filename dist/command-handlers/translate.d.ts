/** @format */
import type { ChatInputCommandInteraction } from 'discord.js';
import type { ReadonlyTranslator } from '../types.ts';
import type { Guild } from '../guild.ts';
export declare function translateHandler(
  translator: ReadonlyTranslator | undefined
): (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>) => Promise<void>;
