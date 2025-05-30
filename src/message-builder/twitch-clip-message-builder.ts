import { EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';

import type {
  TwitchClip,
  TwitchClipMessageBuilderTransformFunctionReturnType,
  ReadonlyEmbedBuilder
} from '../types.js';
import { BaseMessageBuilder } from './base.js';

const { EMBED_SERVER_HOST } = process.env;

export class TwitchClipMessageBuilder extends BaseMessageBuilder<
  TwitchClip,
  TwitchClipMessageBuilderTransformFunctionReturnType
> {
  public static readonly messageBuilderType = 'Clip';
  static #staticCounter = 0;
  readonly #sortedByText: string | undefined;

  public constructor(
    interaction: ChatInputCommandInteraction,
    twitchClips: readonly TwitchClip[],
    sortedBy: string | undefined
  ) {
    const transformFunctionWithEmbedServer = (
      twitchClip: TwitchClip
    ): TwitchClipMessageBuilderTransformFunctionReturnType => {
      const { id } = twitchClip;
      const content = `${EMBED_SERVER_HOST}${id}\n${this.currentIndex + 1}/${this.arrayLength}`;

      return {
        content: content,
        components: [this.row]
      } as TwitchClipMessageBuilderTransformFunctionReturnType;
    };

    const transformFunctionWithoutEmbedServer = (
      twitchClip: TwitchClip
    ): TwitchClipMessageBuilderTransformFunctionReturnType => {
      const { title, url, creator_name, game_id, view_count, created_at, thumbnail_url } = twitchClip;

      const embed: ReadonlyEmbedBuilder = new EmbedBuilder()
        .setColor('DarkButNotBlack')
        .setTitle(title)
        .setURL(url)
        .addFields(
          { name: 'Clipper', value: creator_name },
          { name: 'Game', value: game_id, inline: true },
          { name: 'Views', value: view_count.toString(), inline: true },
          { name: 'Created', value: created_at, inline: true }
        )
        .setImage(thumbnail_url)
        .setFooter({
          text: `${this.currentIndex + 1}/${this.arrayLength}. ${this.#sortedByText === 'shuffle' ? 'Shuffled' : `Sorted by ${this.#sortedByText}`}.`
        });

      return {
        embeds: [embed],
        components: [this.row]
      } as TwitchClipMessageBuilderTransformFunctionReturnType;
    };

    const getIdentifierFunction = (twitchClip: TwitchClip): string => {
      return twitchClip.title;
    };

    super(
      TwitchClipMessageBuilder.#staticCounter++,
      TwitchClipMessageBuilder.messageBuilderType,
      interaction,
      twitchClips,
      EMBED_SERVER_HOST !== undefined ? transformFunctionWithEmbedServer : transformFunctionWithoutEmbedServer,
      getIdentifierFunction,
      'title'
    );

    this.#sortedByText = sortedBy ?? 'date created(newest first)';
  }
}
