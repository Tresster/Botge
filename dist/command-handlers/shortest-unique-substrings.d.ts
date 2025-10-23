/** @format */
import type { ChatInputCommandInteraction } from 'discord.js';
import { EmoteMessageBuilder } from '../message-builders/emote-message-builder.ts';
import type { EmoteMatcher } from '../emote-matcher.ts';
import type { Guild } from '../guild.ts';
export declare function getAllSubstrings(str: string): readonly string[];
export declare function getShortestUniqueSubstrings(
  em: Readonly<EmoteMatcher>,
  text: string
): readonly [string | undefined, readonly string[] | undefined];
export declare function shortestuniquesubstringsHandler(
  emoteMessageBuilders: EmoteMessageBuilder[]
): (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>) => Promise<void>;
