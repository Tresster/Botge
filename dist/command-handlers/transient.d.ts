/** @format */
import { type ChatInputCommandInteraction } from 'discord.js';
import type { Guild } from '../guild.ts';
export declare function transientHandler(): (
  interaction: ChatInputCommandInteraction,
  guild: Readonly<Guild>
) => Promise<undefined>;
