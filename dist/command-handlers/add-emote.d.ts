/** @format */
import type { ChatInputCommandInteraction } from 'discord.js';
import type { AddedEmotesDatabase } from '../api/added-emotes-database.ts';
import type { Guild } from '../guild.ts';
export declare function addEmoteHandlerSevenTVNotInSet(
  addedEmotesDatabase: Readonly<AddedEmotesDatabase>
): (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>) => Promise<void>;
