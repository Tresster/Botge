import {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  type MessageActionRowComponentBuilder
} from 'discord.js';

import {
  emoteCdnUrlToEmoteApiCdnUrl,
  emoteCdnUrlToEmoteUrl
} from '../utils/message-builder/emote-cdn-url-to-emote-url.js';
import { platformToString } from '../utils/platform-to-string.js';
import { booleanToString } from '../utils/boolean-to-string.js';
import type {
  AddedEmote,
  AssetInfo,
  EmoteMessageBuilderTransformFunctionReturnType,
  ReadonlyActionRowBuilderMessageActionRowComponentBuilder
} from '../types.js';
import { BaseMessageBuilder, getCustomId, DELETE_BUTTON_BASE_CUSTOM_ID } from './base.js';
import { Platform } from '../enums.js';

export class EmoteMessageBuilder extends BaseMessageBuilder<AssetInfo, EmoteMessageBuilderTransformFunctionReturnType> {
  public static readonly messageBuilderType = 'Emote';
  static #staticCounter = 0;
  readonly #extraRow: ReadonlyActionRowBuilderMessageActionRowComponentBuilder | undefined = undefined;
  readonly #shortestUniqueSubstrings: readonly string[] | undefined;
  readonly #markedAsDeleteds: number[] | undefined = undefined;

  public constructor(
    interaction: ChatInputCommandInteraction | ButtonInteraction,
    emotes: readonly AssetInfo[],
    shortestUniqueSubstrings?: readonly string[],
    isAddedEmoteDeleteMode = false
  ) {
    const transformFunction = (assetInfo: AssetInfo): EmoteMessageBuilderTransformFunctionReturnType => {
      const { name, url, zeroWidth, platform, width, height } = assetInfo;

      const embed = new EmbedBuilder();

      if (this.#shortestUniqueSubstrings !== undefined)
        embed.addFields({
          name: 'Shortest Unqiue Substrings',
          value: this.#shortestUniqueSubstrings[this.currentIndex]
        });

      if (this.#markedAsDeleteds !== undefined && this.#markedAsDeleteds.includes(this.currentIndex))
        embed.setDescription('❌ DELETED ❌');

      embed
        .setColor('DarkButNotBlack')
        .setTitle(name)
        .setURL(emoteCdnUrlToEmoteUrl(assetInfo))
        .addFields(
          { name: 'Platform', value: platformToString(platform) },
          { name: 'Zero width', value: booleanToString(zeroWidth), inline: true },
          { name: 'Width', value: width?.toString() ?? 'N/A', inline: true },
          { name: 'Height', value: height?.toString() ?? 'N/A', inline: true }
        )
        .setImage(url)
        .setFooter({
          text: `${this.currentIndex + 1}/${this.arrayLength}.${isAddedEmoteDeleteMode ? ' Sorted alphabetically.' : shortestUniqueSubstrings === undefined ? ' Sorted by date added(newest first).' : ''}`
        });

      return {
        embeds: [embed],
        components: this.#extraRow !== undefined ? [this.row, this.#extraRow] : [this.row]
      } as EmoteMessageBuilderTransformFunctionReturnType;
    };

    const getIdentifierFunction = (assetInfo: AssetInfo): string => {
      return assetInfo.name;
    };

    super(
      EmoteMessageBuilder.#staticCounter++,
      EmoteMessageBuilder.messageBuilderType,
      interaction,
      emotes,
      transformFunction,
      getIdentifierFunction,
      'name'
    );

    if (isAddedEmoteDeleteMode) {
      this.#extraRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(getCustomId(DELETE_BUTTON_BASE_CUSTOM_ID, EmoteMessageBuilder.messageBuilderType, this.counter))
          .setLabel('Delete')
          .setStyle(ButtonStyle.Danger)
      );
      this.#markedAsDeleteds = [];
    }

    this.#shortestUniqueSubstrings = shortestUniqueSubstrings;
  }

  public get currentAddedEmote(): AddedEmote | undefined {
    if (this.#markedAsDeleteds === undefined) return undefined;
    if (this.#markedAsDeleteds.includes(this.currentIndex)) return undefined;

    const currentEmote = this.currentItem;
    if (currentEmote.platform !== Platform.sevenNotInSet) return undefined;

    const emoteCdnUrlToEmoteApiCdnUrl_ = emoteCdnUrlToEmoteApiCdnUrl(currentEmote);
    if (emoteCdnUrlToEmoteApiCdnUrl_ === undefined) return undefined;

    return {
      alias: currentEmote.name,
      url: emoteCdnUrlToEmoteApiCdnUrl_
    } as AddedEmote;
  }

  public markCurrentAsDeleted(): EmoteMessageBuilderTransformFunctionReturnType | undefined {
    if (this.#markedAsDeleteds === undefined) return undefined;
    if (this.#markedAsDeleteds.includes(this.currentIndex)) return undefined;

    this.#markedAsDeleteds.push(this.currentIndex);
    return this.current();
  }
}
