/** @format */
import type { ChatInputCommandInteraction, OmitPartialGroupDMChannel, Message } from 'discord.js';
import type { CachedUrl } from '../api/cached-url.ts';
import { EmoteMessageBuilder } from '../message-builders/emote-message-builder.ts';
import type { Guild } from '../guild.ts';
export declare const EMOTE_COMMAND_IDENTIFIER = '+';
export declare function emoteHandler(): (
  interaction: ChatInputCommandInteraction,
  guild: Readonly<Guild>
) => Promise<void>;
export declare function emoteListHandler(
  emoteMessageBuilders: EmoteMessageBuilder[]
): (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>) => Promise<void>;
export declare function emotesHandler(
  cachedUrl: Readonly<CachedUrl>
): (
  guild: Readonly<Guild>,
  interaction?: ChatInputCommandInteraction,
  message?: OmitPartialGroupDMChannel<Message>
) => Promise<void>;
