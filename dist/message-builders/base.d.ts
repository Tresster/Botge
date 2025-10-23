/** @format */
import { type ChatInputCommandInteraction, type ButtonInteraction } from 'discord.js';
import type {
  AssetInfo,
  EmoteMessageBuilderTransformFunctionReturnType,
  ReadonlyActionRowBuilderMessageActionRowComponentBuilder,
  ReadonlyModalBuilder,
  TwitchClip,
  TwitchClipMessageBuilderTransformFunctionReturnType,
  Ping,
  PingForPingListMessageBuilderTransformFunctionReturnType
} from '../types.ts';
export declare const PREVIOUS_BUTTON_BASE_CUSTOM_ID = 'previousButton';
export declare const NEXT_BUTTON_BASE_CUSTOM_ID = 'nextButton';
export declare const FIRST_BUTTON_BASE_CUSTOM_ID = 'firstButton';
export declare const LAST_BUTTON_BASE_CUSTOM_ID = 'lastButton';
export declare const JUMP_TO_BUTTON_BASE_CUSTOM_ID = 'jumpToButton';
export declare const JUMP_TO_MODAL_BASE_CUSTOM_ID = 'jumpToModal';
export declare const JUMP_TO_TEXT_INPUT_BASE_CUSTOM_ID = 'jumpToTextInput';
export declare const JUMP_TO_IDENTIFIER_INPUT_BASE_CUSTOM_ID = 'jumpToIdentifierTextInput';
export declare function getBaseCustomIdFromCustomId(customId: string): string;
export declare function getMessageBuilderTypeFromCustomId(customId: string): string;
export declare function getCounterFromCustomId(customId: string): number;
export declare function getCustomId(baseCustomId: string, messageBuilderType: string, counter: number): string;
export declare class BaseMessageBuilder<
  ArrayItemType = AssetInfo | TwitchClip | Ping,
  TransformFunctionReturnType =
    | TwitchClipMessageBuilderTransformFunctionReturnType
    | EmoteMessageBuilderTransformFunctionReturnType
    | PingForPingListMessageBuilderTransformFunctionReturnType
> {
  #private;
  protected constructor(
    counter: number,
    messageBuilderType: string,
    interaction: ChatInputCommandInteraction | ButtonInteraction,
    array: readonly ArrayItemType[],
    transformFunction: (arrayItem: ArrayItemType) => TransformFunctionReturnType,
    getIdentifierFunction: ((arrayItem: ArrayItemType) => string) | undefined,
    identifierName: string | undefined
  );
  get counter(): number;
  get interaction(): ChatInputCommandInteraction | ButtonInteraction;
  get modal(): ReadonlyModalBuilder;
  protected get row(): ReadonlyActionRowBuilderMessageActionRowComponentBuilder;
  protected get currentIndex(): number;
  protected get currentItem(): ArrayItemType;
  protected get arrayLength(): number;
  previous(): TransformFunctionReturnType | undefined;
  next(): TransformFunctionReturnType | undefined;
  first(): TransformFunctionReturnType | undefined;
  last(): TransformFunctionReturnType | undefined;
  random(): TransformFunctionReturnType | undefined;
  jumpTo(jumpTo: number): TransformFunctionReturnType | undefined;
  jumpToIdentifer(jumpTo: string): TransformFunctionReturnType | undefined;
  protected current(): TransformFunctionReturnType;
}
