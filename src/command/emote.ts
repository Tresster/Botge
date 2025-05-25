import { spawn } from 'child_process';
import { join } from 'path';
import { ensureDirSync } from 'fs-extra';
import { rm } from 'node:fs/promises';

import type { ChatInputCommandInteraction } from 'discord.js';

import { downloadAsset } from '../utils/download-asset.js';
import { maxPlatformSize, emoteSizeChange, assetSizeChange } from '../utils/size-change.js';
import { parseToken } from '../utils/parse-token.js';
import { stringToBoolean } from '../utils/boolean-to-string.js';
import { stringToPlatform } from '../utils/platform-to-string.js';
import type { CachedUrl } from '../api/cached-url.js';
import type { AssetInfo, DownloadedAsset, HstackElement } from '../types.js';
import { TMP_DIR } from '../paths-and-endpoints.js';
import { EmoteMessageBuilder } from '../message-builders/emote-message-builder.js';
import { GUILD_ID_CUTEDOG } from '../guilds.js';
import type { Platform } from '../enums.js';
import type { Guild } from '../guild.js';

const DEFAULTFPS = 25;
const MAXWIDTH = 192;
const MAXHEIGHT = 64;
const DOWNLOAD_ASSET_ERROR_MESSAGE = 'Failed to download asset(s).';
const FAILED_TO_DOWNLOAD_OR_GET_EMOJI_MESSAGE = 'Failed to download or get emoji(s).';
const SOMETHING_WENT_WRONG_REPLY_MESSAGE = 'Someting went wrong. Please try again later.';

function getMaxWidth(layers: readonly DownloadedAsset[], scaleToHeight: number): number {
  const scaledWidth = layers.map((layer) => (layer.width / layer.height) * scaleToHeight);

  const ret: number = Math.round(Math.max(...scaledWidth));
  return ret % 2 === 0 ? ret : ret + 1; // rounds up to even number because of ffmpeg
}

class SimpleElement implements HstackElement {
  public readonly id: number;
  readonly #asset: DownloadedAsset;
  readonly #width: number;
  readonly #height: number;
  readonly #animated: boolean;

  public constructor(id: number, asset: DownloadedAsset, width: number, height: number) {
    this.id = id;
    this.#asset = asset;
    this.#width = width;
    this.#height = height;
    this.#animated = this.#asset.animated;
  }

  public filterString(): string {
    let filterString = `[${this.id}:v]`;

    if (this.#height > this.#asset.height) filterString += `pad=h=${this.#height}:x=-1:y=-1:color=black@0.0,`;
    filterString += `scale=${this.#width}:${this.#height}:force_original_aspect_ratio=decrease`;
    if (this.#animated) filterString += `,fps=${DEFAULTFPS}`;

    filterString += `[o${this.id}];`;
    return filterString;
  }
}

class OverlayElement implements HstackElement {
  public readonly id: number;
  readonly #layers: readonly DownloadedAsset[];
  readonly #fullSize: boolean;
  readonly #stretch: boolean;
  readonly #height: number;
  readonly #width: number;

  public constructor(
    id: number,
    layers: readonly DownloadedAsset[],
    fullSize: boolean,
    stretch: boolean,
    width: number,
    height: number
  ) {
    this.id = id;
    this.#layers = layers;
    this.#fullSize = fullSize;
    this.#stretch = stretch;

    this.#height = height;
    this.#width = width !== MAXWIDTH ? width : Math.min(getMaxWidth(this.#layers, this.#height), MAXWIDTH);
  }

  public filterString(): string {
    const segments: string[] = [];
    let { id } = this;
    let layerId = 0;

    segments.push(`[${this.id}]`);

    //pad second because scale doesnt keep transparency
    segments.push(`scale=${this.#width}:${this.#height}:force_original_aspect_ratio=decrease`);
    if (this.#height > this.#layers[layerId].height && this.#width > this.#layers[layerId].width)
      segments.push(`,pad=${this.#width}:${this.#height}:x=-1:y=-1:color=black@0.0`);
    else if (this.#height > this.#layers[layerId].height)
      segments.push(`,pad=h=${this.#height}:x=-1:y=-1:color=black@0.0`);
    else if (this.#width > this.#layers[layerId].width)
      segments.push(`,pad=w=${this.#width}:x=-1:y=-1:color=black@0.0`);

    if (this.#layers[layerId].animated) segments.push(`,fps=${DEFAULTFPS}`);

    segments.push(`[o${this.id}];`);

    id++;
    layerId++;

    // other layers
    this.#layers.slice(1).forEach(() => {
      const segmentWidth = this.#stretch ? this.#width : this.#fullSize ? this.#layers[layerId].width : -1;
      const segmentHeight = this.#stretch ? this.#height : this.#fullSize ? this.#layers[layerId].height : MAXHEIGHT;

      segments.push(`[${id}]`);

      segments.push(`scale=${segmentWidth}:${segmentHeight}`);
      if (this.#layers[layerId].animated) segments.push(`,fps=${DEFAULTFPS}`);

      segments.push(`[v${id}];`);

      segments.push(`[o${this.id}][v${id}]overlay=(W-w)/2:(H-h)/2[o${this.id}];`);

      id++;
      layerId++;
    });

    return segments.join('');
  }
}

function onlyUnique(value: string, index: number, array: readonly string[]): boolean {
  return array.indexOf(value) === index;
}

export function emoteHandler() {
  return async (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>): Promise<void> => {
    const { emoteMatcher } = guild;
    const emote = String(interaction.options.get('name')?.value).trim();
    if (emote.split(/\s+/).length > 1) {
      await interaction.reply({ content: 'Please use /emotes for combined emotes.', flags: 'Ephemeral' });
      return;
    }

    const defer = interaction.deferReply();
    try {
      const emoteNotFoundReply = interaction.guildId === GUILD_ID_CUTEDOG ? 'jij' : 'emote not found';

      const size = ((): number | undefined => {
        const sizeOptions = interaction.options.get('size')?.value;
        return sizeOptions !== undefined ? Number(sizeOptions) : undefined;
      })();

      const match = emoteMatcher.matchSingle(emote);

      if (match === undefined) {
        await defer;
        try {
          new URL(emote);
          await interaction.editReply('posting link through Botge wtf');
        } catch {
          await interaction.editReply(emoteNotFoundReply);
        }
        return;
      }

      const { url, platform } = match;

      await defer;
      if (size !== undefined)
        await interaction.editReply(emoteSizeChange(url, size, platform).replace('.gif', '.webp'));
      else await interaction.editReply(url.replace('.gif', '.webp'));
    } catch (error) {
      console.log(`Error at emoteSingleHandler --> ${error instanceof Error ? error.message : String(error)}`);

      await defer;
      await interaction.editReply(SOMETHING_WENT_WRONG_REPLY_MESSAGE);
    }
  };
}

export function emoteListHandler(emoteMessageBuilders: EmoteMessageBuilder[]) {
  return async (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>): Promise<void> => {
    const { emoteMatcher } = guild;
    const defer = interaction.deferReply();
    try {
      const emoteNotFoundReply = interaction.guildId === GUILD_ID_CUTEDOG ? 'jij' : 'emote not found';

      const query = ((): string => {
        const option = interaction.options.get('query')?.value;
        return option !== undefined ? String(option).trim() : '';
      })();

      const platform = ((): Platform | undefined => {
        const option = interaction.options.get('platform')?.value;
        return option !== undefined ? stringToPlatform(String(option)) : undefined;
      })();

      const animated = ((): boolean | undefined => {
        const option = interaction.options.get('animated')?.value;
        return option !== undefined ? stringToBoolean(String(option)) : undefined;
      })();

      const zeroWidth = ((): boolean | undefined => {
        const option = interaction.options.get('overlaying')?.value;
        return option !== undefined ? stringToBoolean(String(option)) : undefined;
      })();

      const matches = emoteMatcher.matchSingleArray(query, platform, animated, zeroWidth, undefined, true);

      if (matches === undefined) {
        await defer;
        try {
          new URL(query);
          await interaction.editReply('posting link through Botge wtf');
        } catch {
          await interaction.editReply(emoteNotFoundReply);
        }
        return;
      }

      const transformedMatches: readonly AssetInfo[] = matches.map(
        (asset) => ({ ...asset, url: asset.url.replace('.gif', '.webp') }) as AssetInfo
      );

      const emoteMessageBuilder = new EmoteMessageBuilder(interaction, transformedMatches);
      const reply = emoteMessageBuilder.first();
      await defer;

      if (reply === undefined) return undefined;
      await interaction.editReply(reply);
      emoteMessageBuilders.push(emoteMessageBuilder);
      return;
    } catch (error) {
      console.log(`Error at emoteListHandler --> ${error instanceof Error ? error.message : String(error)}`);

      await defer;
      await interaction.editReply(SOMETHING_WENT_WRONG_REPLY_MESSAGE);
      return;
    }
  };
}

export function emotesHandler(cachedUrl: Readonly<CachedUrl>) {
  return async (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>): Promise<void> => {
    const { emoteMatcher } = guild;

    const ephemeral = Boolean(interaction.options.get('ephemeral')?.value);
    const defer = ephemeral ? interaction.deferReply({ flags: 'Ephemeral' }) : interaction.deferReply();
    const outdir = join(TMP_DIR, String(interaction.id));

    try {
      const emoteNotFoundReply = interaction.guildId === GUILD_ID_CUTEDOG ? 'jij' : 'emote not found';

      const tokens: readonly string[] = String(interaction.options.get('emotes')?.value).trim().split(/\s+/);
      const size = ((): number | undefined => {
        const sizeOptions = interaction.options.get('size')?.value;
        return sizeOptions !== undefined ? Number(sizeOptions) : undefined;
      })();
      const fullSize = Boolean(interaction.options.get('fullsize')?.value);
      const stretch = Boolean(interaction.options.get('stretch')?.value);

      if (tokens.length === 1) {
        const [token] = tokens;
        const match = emoteMatcher.matchSingle(token);

        if (match === undefined) {
          await defer;
          try {
            new URL(token);
            await interaction.editReply('posting link through Botge wtf');
          } catch {
            await interaction.editReply(emoteNotFoundReply);
          }
          return;
        }

        const { url, platform } = match;
        const reply = (
          fullSize
            ? emoteSizeChange(url, maxPlatformSize(platform), platform)
            : size !== undefined
              ? emoteSizeChange(url, size, platform)
              : url
        ).replace('.gif', '.webp');

        await defer;
        await interaction.editReply(reply);
        return;
      }

      //dir sync only if multiple emotes
      ensureDirSync(outdir);

      const uniqueTokens: readonly string[] = tokens.filter(onlyUnique);
      const tokenPairs = ((): readonly (readonly [string, number])[] => {
        const tokenPairs_: (readonly [string, number])[] = [];

        for (const i of tokens.keys())
          for (const j of uniqueTokens.keys()) if (tokens[i] === uniqueTokens[j]) tokenPairs_.push([tokens[i], j]);

        return tokenPairs_;
      })();

      const uniqueAssetsWithNullAndUndefined: readonly (AssetInfo | string | null | undefined)[] = await Promise.all(
        emoteMatcher
          .matchMulti(uniqueTokens)
          .map(async (match, i) =>
            match !== undefined
              ? fullSize
                ? assetSizeChange(match, maxPlatformSize(match.platform))
                : size !== undefined
                  ? assetSizeChange(match, size)
                  : match
              : parseToken(uniqueTokens[i], fullSize).catch(() => null)
          )
      );

      if (uniqueAssetsWithNullAndUndefined.some((asset) => asset === null)) {
        await defer;
        await interaction.editReply(FAILED_TO_DOWNLOAD_OR_GET_EMOJI_MESSAGE);
        return;
      }
      if (uniqueAssetsWithNullAndUndefined.some((asset) => asset === undefined)) {
        await defer;
        await interaction.editReply(emoteNotFoundReply);
        return;
      }

      const uniqueAssets: readonly (AssetInfo | string)[] = uniqueAssetsWithNullAndUndefined.filter(
        (asset) => asset !== null && asset !== undefined
      );

      const assets = ((): readonly (AssetInfo | string)[] => {
        const assets_: (AssetInfo | string)[] = [];

        for (const i of tokenPairs.keys()) {
          for (const j of uniqueAssets.keys()) {
            if (tokenPairs[i][1] === j) assets_.push(uniqueAssets[j]);
          }
        }

        return assets_;
      })();

      const downloadedAssets = await (async (): Promise<readonly DownloadedAsset[]> => {
        const downloadedAssets_: readonly DownloadedAsset[] = (
          await Promise.all(uniqueAssets.map(async (asset, i) => downloadAsset(outdir, asset, i, cachedUrl)))
        ).filter((downloadedAsset) => downloadedAsset !== undefined);
        const downloadedAssets2_: DownloadedAsset[] = [];

        for (const i of tokenPairs.keys()) {
          for (const j of downloadedAssets_.keys()) {
            if (tokenPairs[i][1] === j) downloadedAssets2_.push(downloadedAssets_[j]);
          }
        }

        return downloadedAssets2_;
      })();
      if (downloadedAssets.length !== assets.length) throw new Error(DOWNLOAD_ASSET_ERROR_MESSAGE);

      const maxHeight = ((): number => {
        const maxHeight_ = Math.max(...downloadedAssets.map((asset) => asset.height));
        return fullSize ? (maxHeight_ % 2 === 0 ? maxHeight_ : maxHeight_ + 1) : MAXHEIGHT;
      })();
      const maxWidth = fullSize ? getMaxWidth(downloadedAssets, maxHeight) : MAXWIDTH;

      const elements: HstackElement[] = [];
      ((): void => {
        // at least 2
        let boundary = 0;
        let i = 0;
        for (; i < downloadedAssets.length; i++) {
          const asset = assets[i];

          if ((typeof asset === 'object' && !asset.zeroWidth) || typeof asset === 'string') {
            // new group
            if (i === boundary + 1) {
              // single element
              elements.push(new SimpleElement(boundary, downloadedAssets[boundary], maxWidth, maxHeight));
              boundary = i;
            } else if (i > boundary) {
              // at least 2
              elements.push(
                new OverlayElement(
                  boundary,
                  downloadedAssets.slice(boundary, i),
                  fullSize,
                  stretch,
                  maxWidth,
                  maxHeight
                )
              );
              boundary = i;
            }
          }
        }

        // don't forget last one
        if (i === boundary + 1) {
          // single element
          elements.push(new SimpleElement(boundary, downloadedAssets[boundary], maxWidth, maxHeight));
        } else if (i > boundary) {
          // at least 2
          elements.push(
            new OverlayElement(boundary, downloadedAssets.slice(boundary, i), fullSize, stretch, maxWidth, maxHeight)
          );
        }
      })();

      const maxDuration = Math.max(...downloadedAssets.map((layer) => layer.duration));
      const animated = downloadedAssets.some((asset) => asset.animated);

      const args: string[] = [];

      downloadedAssets.forEach((asset) => {
        if (animated && asset.animated) {
          args.push('-stream_loop');
          args.push('-1');
          args.push('-t');
          args.push(`${maxDuration}`);
        }

        args.push('-i');
        if (asset.filename.startsWith('http://') || asset.filename.startsWith('https://'))
          args.push('cache:' + asset.filename);
        else args.push(asset.filename);
      });

      args.push('-filter_complex');
      const filter: string[] = elements.map((element) => element.filterString());

      // hstack
      if (elements.length > 1) {
        filter.push(elements.map((element) => `[o${element.id}]`).join(''));
        filter.push(`hstack=inputs=${elements.length}`);
      } else {
        filter.push(`[o0]scale`); // only to point the output stream
      }

      // if (animated) filter.push(',split=2[stacked][palette];[palette]palettegen[p];[stacked][p]paletteuse');
      args.push(filter.join(''));

      args.push('-c:v');
      if (animated) {
        args.push('libwebp_anim');
        args.push('-loop');
        args.push('0');
      } else {
        args.push('libwebp');
      }

      args.push('-y');
      args.push('-fs');
      args.push('25M');

      const outfile = join(outdir, 'output.webp');
      args.push(outfile);

      const ffmpeg = spawn('ffmpeg', args);

      console.log("ffmpeg '" + args.join("' '") + "'");

      ffmpeg.on(
        'close',
        (() => {
          //Here you can get the exit code of the script
          return async function (code: number): Promise<void> {
            await defer;
            if (code === 0) await interaction.editReply({ files: [outfile] });
            else await interaction.editReply('gif creation failed');
            void rm(outdir, { recursive: true });
          };
        })()
      );

      //???
      //await defer;
    } catch (error) {
      console.log(`Error at emoteCombinedHandler --> ${error instanceof Error ? error.message : String(error)}`);
      const editReplyMessage =
        error instanceof Error && error.message === DOWNLOAD_ASSET_ERROR_MESSAGE
          ? 'failed to download gif(s)/png(s)'
          : 'gif creation failed.';

      await defer;
      await interaction.editReply(editReplyMessage);
      void rm(outdir, { recursive: true });
    }
  };
}
