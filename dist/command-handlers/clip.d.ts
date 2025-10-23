/** @format */
import type { ChatInputCommandInteraction } from 'discord.js';
import { TwitchClipMessageBuilder } from '../message-builders/twitch-clip-message-builder.ts';
import type { Guild } from '../guild.ts';
export declare function clipHandler(
  twitchClipMessageBuilders: TwitchClipMessageBuilder[]
): (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>) => Promise<void>;
