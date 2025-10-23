/** @format */
import { type ChatInputCommandInteraction, type ButtonInteraction } from 'discord.js';
import type { PingForPingListMessageBuilderTransformFunctionReturnType } from '../types.ts';
import { BaseMessageBuilder } from './base.ts';
import type { PingForPingMeMessageBuilder } from './ping-for-ping-me-message-builder.ts';
export declare class PingForPingListMessageBuilder extends BaseMessageBuilder<
  Readonly<PingForPingMeMessageBuilder>,
  PingForPingListMessageBuilderTransformFunctionReturnType
> {
  #private;
  static readonly messageBuilderType = 'PingForPingList';
  constructor(
    interaction: ChatInputCommandInteraction | ButtonInteraction,
    pingForPingMeMessageBuilders: readonly Readonly<PingForPingMeMessageBuilder>[],
    timezone: string | undefined
  );
  get currentPingForPingMeMessageBuilder(): Readonly<PingForPingMeMessageBuilder> | undefined;
  markCurrentAsDeleted(): PingForPingListMessageBuilderTransformFunctionReturnType | undefined;
}
