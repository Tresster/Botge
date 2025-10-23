/** @format */
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Guild } from '../guild.ts';
export declare function findTheEmojiHandler(): (
  interaction: ChatInputCommandInteraction,
  guild: Readonly<Guild>
) => Promise<void>;
