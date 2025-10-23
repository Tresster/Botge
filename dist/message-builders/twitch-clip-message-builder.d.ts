/** @format */
import { type ChatInputCommandInteraction } from 'discord.js';
import type { TwitchClip, TwitchClipMessageBuilderTransformFunctionReturnType } from '../types.ts';
import { BaseMessageBuilder } from './base.ts';
export declare class TwitchClipMessageBuilder extends BaseMessageBuilder<
  TwitchClip,
  TwitchClipMessageBuilderTransformFunctionReturnType
> {
  #private;
  static readonly messageBuilderType = 'Clip';
  constructor(
    interaction: ChatInputCommandInteraction,
    twitchClips: readonly TwitchClip[],
    sortedBy: string | undefined
  );
}
