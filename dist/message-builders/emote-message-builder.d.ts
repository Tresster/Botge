/** @format */
import { type ChatInputCommandInteraction, type ButtonInteraction } from 'discord.js';
import type { AddedEmote, AssetInfo, EmoteMessageBuilderTransformFunctionReturnType } from '../types.ts';
import { BaseMessageBuilder } from './base.ts';
export declare const DELETE_EMOTE_BUTTON_BASE_CUSTOM_ID = 'deleteEmoteButton';
export declare class EmoteMessageBuilder extends BaseMessageBuilder<
  AssetInfo,
  EmoteMessageBuilderTransformFunctionReturnType
> {
  #private;
  static readonly messageBuilderType = 'Emote';
  constructor(
    interaction: ChatInputCommandInteraction | ButtonInteraction,
    emotes: readonly AssetInfo[],
    shortestUniqueSubstrings?: readonly string[],
    isAddedEmoteDeleteMode?: boolean
  );
  get currentAddedEmote(): AddedEmote | undefined;
  markCurrentAsDeleted(): EmoteMessageBuilderTransformFunctionReturnType | undefined;
}
