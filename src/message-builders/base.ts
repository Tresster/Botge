/** @format */

import {
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  LabelBuilder,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  type MessageActionRowComponentBuilder
} from 'discord.js';

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

export const PREVIOUS_BUTTON_BASE_CUSTOM_ID = 'previousButton' as const;
export const NEXT_BUTTON_BASE_CUSTOM_ID = 'nextButton' as const;
export const FIRST_BUTTON_BASE_CUSTOM_ID = 'firstButton' as const;
export const LAST_BUTTON_BASE_CUSTOM_ID = 'lastButton' as const;
export const JUMP_TO_BUTTON_BASE_CUSTOM_ID = 'jumpToButton' as const;
export const JUMP_TO_MODAL_BASE_CUSTOM_ID = 'jumpToModal' as const;
export const JUMP_TO_TEXT_INPUT_BASE_CUSTOM_ID = 'jumpToTextInput' as const;
export const JUMP_TO_IDENTIFIER_INPUT_BASE_CUSTOM_ID = 'jumpToIdentifierTextInput' as const;

const BUTTON_CUSTOM_ID_SPLITTER = '-' as const;

export function getBaseCustomIdFromCustomId(customId: string): string {
  return customId.split(BUTTON_CUSTOM_ID_SPLITTER)[0];
}

export function getMessageBuilderTypeFromCustomId(customId: string): string {
  return customId.split(BUTTON_CUSTOM_ID_SPLITTER)[1];
}

export function getCounterFromCustomId(customId: string): number {
  return Number(customId.split(BUTTON_CUSTOM_ID_SPLITTER)[2]);
}

export function getCustomId(baseCustomId: string, messageBuilderType: string, counter: number): string {
  return `${baseCustomId}${BUTTON_CUSTOM_ID_SPLITTER}${messageBuilderType}${BUTTON_CUSTOM_ID_SPLITTER}${counter}`;
}

function randomNumberInInterval(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export class BaseMessageBuilder<
  ArrayItemType = AssetInfo | TwitchClip | Ping,
  TransformFunctionReturnType =
    | TwitchClipMessageBuilderTransformFunctionReturnType
    | EmoteMessageBuilderTransformFunctionReturnType
    | PingForPingListMessageBuilderTransformFunctionReturnType
> {
  readonly #counter: number;
  readonly #interaction: ChatInputCommandInteraction | ButtonInteraction;
  readonly #array: readonly ArrayItemType[];
  readonly #row: ReadonlyActionRowBuilderMessageActionRowComponentBuilder;
  readonly #modal: ReadonlyModalBuilder;
  readonly #transformFunction: (arrayItem: ArrayItemType) => TransformFunctionReturnType;
  readonly #getIdentifierFunction: ((arrayItem: ArrayItemType) => string) | undefined;
  #currentIndex: number;

  protected constructor(
    counter: number,
    messageBuilderType: string,
    interaction: ChatInputCommandInteraction | ButtonInteraction,
    array: readonly ArrayItemType[],
    transformFunction: (arrayItem: ArrayItemType) => TransformFunctionReturnType,
    getIdentifierFunction: ((arrayItem: ArrayItemType) => string) | undefined,
    identifierName: string | undefined
  ) {
    this.#counter = counter;
    this.#interaction = interaction;
    this.#array = array;
    this.#transformFunction = transformFunction;
    this.#getIdentifierFunction = getIdentifierFunction;
    //-1 because of first element
    this.#currentIndex = -1;

    this.#row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(getCustomId(FIRST_BUTTON_BASE_CUSTOM_ID, messageBuilderType, this.#counter))
        .setLabel('First')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(getCustomId(PREVIOUS_BUTTON_BASE_CUSTOM_ID, messageBuilderType, this.#counter))
        .setLabel('Previous')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(getCustomId(JUMP_TO_BUTTON_BASE_CUSTOM_ID, messageBuilderType, this.#counter))
        .setLabel('Jump to')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(getCustomId(NEXT_BUTTON_BASE_CUSTOM_ID, messageBuilderType, this.#counter))
        .setLabel('Next')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(getCustomId(LAST_BUTTON_BASE_CUSTOM_ID, messageBuilderType, this.#counter))
        .setLabel('Last')
        .setStyle(ButtonStyle.Secondary)
    );

    this.#modal = new ModalBuilder()
      .setCustomId(getCustomId(JUMP_TO_MODAL_BASE_CUSTOM_ID, messageBuilderType, this.#counter))
      .setTitle('Jump to')
      .addLabelComponents(
        new LabelBuilder()
          .setLabel('Jump to index')
          .setDescription('If empty it jumps to a random index.')
          .setTextInputComponent(
            new TextInputBuilder()
              .setCustomId(getCustomId(JUMP_TO_TEXT_INPUT_BASE_CUSTOM_ID, messageBuilderType, this.#counter))
              .setMaxLength(6)
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('random')
              .setRequired(false)
          )
      );

    if (identifierName !== undefined && getIdentifierFunction !== undefined) {
      this.#modal.addLabelComponents(
        new LabelBuilder()
          .setLabel(`Jump to ${identifierName}`)
          .setDescription(`The ${identifierName} of the item you wish to jump to.`)
          .setTextInputComponent(
            new TextInputBuilder()
              .setCustomId(getCustomId(JUMP_TO_IDENTIFIER_INPUT_BASE_CUSTOM_ID, messageBuilderType, this.#counter))
              .setMaxLength(20)
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
          )
      );
    }
  }

  public get counter(): number {
    return this.#counter;
  }
  public get interaction(): ChatInputCommandInteraction | ButtonInteraction {
    return this.#interaction;
  }
  public get modal(): ReadonlyModalBuilder {
    return this.#modal;
  }

  protected get row(): ReadonlyActionRowBuilderMessageActionRowComponentBuilder {
    return this.#row;
  }
  protected get currentIndex(): number {
    return this.#currentIndex;
  }
  protected get currentItem(): ArrayItemType {
    return this.#array[this.#currentIndex];
  }
  protected get arrayLength(): number {
    return this.#array.length;
  }

  public previous(): TransformFunctionReturnType | undefined {
    if (this.#currentIndex <= 0) return undefined;
    return this.#transformFunction(this.#array[--this.#currentIndex]);
  }

  public next(): TransformFunctionReturnType | undefined {
    if (this.#currentIndex >= this.#array.length - 1) return undefined;
    return this.#transformFunction(this.#array[++this.#currentIndex]);
  }

  public first(): TransformFunctionReturnType | undefined {
    if (this.#currentIndex === 0) return undefined;
    this.#currentIndex = 0;
    return this.#transformFunction(this.#array[this.#currentIndex]);
  }

  public last(): TransformFunctionReturnType | undefined {
    if (this.#currentIndex === this.#array.length - 1) return undefined;
    this.#currentIndex = this.#array.length - 1;
    return this.#transformFunction(this.#array[this.#currentIndex]);
  }

  public random(): TransformFunctionReturnType | undefined {
    if (this.#array.length === 1) return undefined;

    const randomNumberInInterval_ = ((): number => {
      let randomNumber = randomNumberInInterval(0, this.#array.length - 1);
      while (randomNumber === this.#currentIndex) randomNumber = randomNumberInInterval(0, this.#array.length - 1);

      return randomNumber;
    })();

    this.#currentIndex = randomNumberInInterval_;
    return this.#transformFunction(this.#array[this.#currentIndex]);
  }

  public jumpTo(jumpTo: number): TransformFunctionReturnType | undefined {
    if (jumpTo > this.#array.length - 1) return undefined;
    else if (jumpTo < 0) return undefined;

    if (this.#currentIndex === jumpTo) return undefined;
    this.#currentIndex = jumpTo;
    return this.#transformFunction(this.#array[this.#currentIndex]);
  }

  public jumpToIdentifier(jumpTo: string): TransformFunctionReturnType | undefined {
    if (jumpTo === '' || this.#getIdentifierFunction === undefined) return undefined;

    for (const [index, arrayItem] of this.#array.entries()) {
      const identifier = this.#getIdentifierFunction(arrayItem);
      if (identifier === jumpTo) {
        if (this.#currentIndex === index) return undefined;

        this.#currentIndex = index;
        return this.current();
      }
    }

    for (const [index, arrayItem] of this.#array.entries()) {
      const identifier = this.#getIdentifierFunction(arrayItem);
      if (identifier.toLowerCase() === jumpTo.toLowerCase()) {
        if (this.#currentIndex === index) return undefined;

        this.#currentIndex = index;
        return this.current();
      }
    }

    for (const [index, arrayItem] of this.#array.entries()) {
      const identifier = this.#getIdentifierFunction(arrayItem);
      if (identifier.toLowerCase().includes(jumpTo.toLowerCase())) {
        if (this.#currentIndex === index) return undefined;

        this.#currentIndex = index;
        return this.current();
      }
    }

    return undefined;
  }

  protected current(): TransformFunctionReturnType {
    return this.#transformFunction(this.#array[this.#currentIndex]);
  }
}
