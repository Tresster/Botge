import { exec, spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import fetch from 'node-fetch';
import { writeFile, rm } from 'node:fs/promises';

import { CommandInteraction } from 'discord.js';

import { AssetInfo, EmoteMatcher, Platform } from '../emoteMatcher.js';

const DEFAULTDURATION: number = 0;
const DEFAULTFPS: number = 25;
const MAXWIDTH: number = 192;
const MAXHEIGHT: number = 64;

interface DownloadedAsset {
  filename: string;
  asset: AssetInfo;
  w: number;
  h: number;
  duration: number; // stills are DEFAULTDURATION
  animated: boolean;
}

interface HstackElement {
  id: number;
  animated: boolean;
  filterString: () => string;
}

class SimpleElement implements HstackElement {
  id: number;
  asset: DownloadedAsset;
  animated: boolean;

  constructor(id: number, asset: DownloadedAsset) {
    this.id = id;
    this.asset = asset;
    this.animated = this.asset.animated;
  }

  filterString(): string {
    let filterstring = `[${this.id}:v]scale=${MAXWIDTH}:${MAXHEIGHT}:force_original_aspect_ratio=decrease`;
    if (this.animated) filterstring += `,fps=${DEFAULTFPS},pad=h=${MAXHEIGHT}:x=-1:y=-1:color=black@0.0`;
    filterstring += `[o${this.id}];`;
    return filterstring;
  }
}

/*
interface Layer {
  id: number;
  asset: AssetInfo[];
}
*/

class OverlayElement implements HstackElement {
  id: number;
  layers: DownloadedAsset[];
  w: number;
  h: number;
  //durationSeconds: number; // NaN => not animated
  animated: boolean;

  constructor(id: number, layers: DownloadedAsset[], height: number) {
    this.id = id;
    this.layers = layers;
    this.h = height;
    this.animated = this.layers.some((layer) => layer.animated);
  }

  _getMaxWidth(scaleToHeight: number): number {
    const scaledWidth: number[] = this.layers.map((layer) => {
      return (layer.w / layer.h) * scaleToHeight;
    });
    const ret = Math.round(Math.min(Math.max(...scaledWidth), MAXWIDTH));
    return ret % 2 == 0 ? ret : ret + 1; // rounds up to even number because of ffmpeg
  }

  filterString(): string {
    this.w = this._getMaxWidth(this.h);

    const segments: string[] = [];

    let id: number = this.id;
    let layerid: number = 0;
    // first layer, pad the canvas
    segments.push(`[${this.id}]scale=${MAXWIDTH}:${MAXHEIGHT}:force_original_aspect_ratio=decrease`);
    if (this.animated && this.layers[layerid].animated) {
      segments.push(`,fps=${DEFAULTFPS}`);
    }
    segments.push(`,pad=${this.w}:${this.h}:-1:-1:color=black@0.0[o${this.id}];`);
    id++;
    layerid++;

    // other layers
    this.layers.slice(1).forEach(() => {
      segments.push(`[${id}]scale=-1:${MAXHEIGHT}`);
      if (this.animated && this.layers[layerid].animated) {
        segments.push(`,fps=${DEFAULTFPS}`);
      }
      segments.push(`[v${id}];[o${this.id}][v${id}]overlay=(W-w)/2:(H-h)/2[o${this.id}];`);
      id++;
      layerid++;
    });

    return segments.join('');
    //// SURELY IT WORKS
  }
}

async function _getDimension(filename: string): Promise<[number, number]> {
  return new Promise((resolve, reject) => {
    exec(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 ${filename}`,
      (error, stdout, stderr) => {
        if (error) {
          reject(`Error getting widthAndHeight: ${stderr}`);
          return;
        }
        const widthAndHeight = stdout.trim();

        if (widthAndHeight === 'N/A' || widthAndHeight === '') {
          reject(new Error('Width and height is either N/A or empty.'));
        } else {
          const widthAndHeightSplit = widthAndHeight.split('x');
          const width = Number(widthAndHeightSplit[0]);
          const height = Number(widthAndHeightSplit[1]);
          resolve([width, height]);
        }
      }
    );
  });
}

async function _getDuration(filename: string): Promise<number> {
  return new Promise((resolve, reject) => {
    exec(
      `ffprobe -v error -select_streams v:0 -show_entries stream=duration -of default=noprint_wrappers=1:nokey=1 "${filename}"`,
      (error, stdout, stderr) => {
        if (error) {
          reject(`Error getting duration: ${stderr}`);
          return;
        }
        const duration = stdout.trim();
        // Check if duration is "N/A" or empty, and use a default value
        if (duration === 'N/A' || duration === '') {
          reject(new Error('Duration is either N/A or empty.')); // or any default value you prefer
        } else {
          resolve(parseFloat(duration));
        }
      }
    );
  });
}

async function downloadAsset(outdir: string, asset: AssetInfo, i: number): Promise<DownloadedAsset> {
  const response = await fetch(asset.url);
  const buffer = await response.buffer();
  const animated = asset.animated;
  const hasWidthAndHeight = asset.width && asset.height;
  const filename = path.join(outdir, `${i}_` + path.basename(asset.url));
  await writeFile(filename, buffer);

  let duration: typeof DEFAULTDURATION | number | Promise<number> = DEFAULTDURATION;
  let widthAndHeight: [number | undefined, number | undefined] | Promise<[number, number]> = [
    asset.width,
    asset.height
  ];
  if (animated) {
    duration = _getDuration(filename);
  }
  if (!hasWidthAndHeight) {
    widthAndHeight = _getDimension(filename);
  }

  widthAndHeight = await widthAndHeight;
  duration = await duration;
  return {
    filename: filename,
    asset: asset,
    w: widthAndHeight[0],
    h: widthAndHeight[1],
    duration: duration,
    animated: duration !== DEFAULTDURATION
  };
}

export function emoteHandler(em: EmoteMatcher) {
  return async (interaction: CommandInteraction) => {
    const defer = interaction.deferReply();
    try {
      const tokens: string[] = String(interaction.options.get('name').value).trim().split(/\s+/);
      const matchmulti: (AssetInfo | undefined)[] = em.matchMulti(tokens);
      const assets: AssetInfo[] = matchmulti.filter((asset) => asset !== undefined);

      if (assets.length === 0) {
        await defer;
        await interaction.editReply('jij');
        return;
      }

      if (assets.length === 1) {
        const asset: AssetInfo = assets[0];
        const platform: Platform = asset.platform;
        const sizeString: string | undefined = String(interaction.options.get('size')?.value);
        const size: number | undefined = sizeString ? Number(sizeString) : undefined;
        let url: string = asset.url;

        if (size) {
          if (size >= 1 && size <= 4) {
            if (platform === Platform.Seven) {
              url = url.replace('/2x', `/${size}x`);
            } else if (platform === Platform.BTTV) {
              if (size < 4) url = url.replace('/2x', `/${size}x`);
            } else if (platform === Platform.FFZ) {
              if (size !== 3) url = url.slice(0, -1) + `${size}`;
            } else if (platform === Platform.Twitch) {
              if (size < 4) url = url.replace('/2.0', `/${size}.0`);
            }
          }
        }

        await defer;
        await interaction.editReply(url);
        return;
      }

      const outdir = path.join('tmp', String(interaction.id));
      fs.ensureDirSync(outdir);

      const downloadedAssets: DownloadedAsset[] = await Promise.all(
        assets.map((asset, i) => downloadAsset(outdir, asset, i))
      );

      // at least 2
      let boundary: number = 0;
      let i: number = 0;
      const elements: HstackElement[] = [];
      for (; i < downloadedAssets.length; i++) {
        if (!assets[i].zero_width) {
          // new group
          if (i == boundary + 1) {
            // single element
            elements.push(new SimpleElement(boundary, downloadedAssets[boundary]));
            boundary = i;
          } else if (i > boundary) {
            // at least 2
            elements.push(new OverlayElement(boundary, downloadedAssets.slice(boundary, i), MAXHEIGHT));
            boundary = i;
          }
        }
      }

      // don't forget last one
      if (i == boundary + 1) {
        // single element
        elements.push(new SimpleElement(boundary, downloadedAssets[boundary]));
      } else if (i > boundary) {
        // at least 2
        elements.push(new OverlayElement(boundary, downloadedAssets.slice(boundary, i), MAXHEIGHT));
      }

      const maxDuration: number = Math.max(...downloadedAssets.map((layer) => layer.duration));
      const animated: boolean = maxDuration != DEFAULTDURATION;

      const args: string[] = [];

      downloadedAssets.forEach((asset) => {
        if (animated && asset.animated) {
          args.push('-stream_loop');
          args.push('-1');
          args.push('-t');
          args.push(`${maxDuration}`);
        }
        args.push('-i');
        args.push(`${asset.filename}`);
      });

      args.push('-filter_complex');
      const filter: string[] = elements.map((e) => e.filterString());

      // hstack
      if (elements.length > 1) {
        filter.push(elements.map((e) => `[o${e.id}]`).join(''));
        filter.push(`hstack=inputs=${elements.length}`);
      } else {
        filter.push(`[o0]scale`); // only to point the output stream
      }

      if (animated) {
        filter.push(',split=2[stacked][palette];[palette]palettegen[p];[stacked][p]paletteuse');
      }
      args.push(filter.join(''));

      args.push('-y');
      args.push('-fs');
      args.push('25M');

      const outfile = path.join(outdir, animated ? 'output.gif' : 'output.png');
      args.push(outfile);

      const ffmpeg = spawn('ffmpeg', args);

      console.log("ffmpeg '" + args.join("' '") + "'");

      ffmpeg.on(
        'close',
        (function (interaction, defer) {
          //Here you can get the exit code of the script
          return async function (code) {
            if (code == 0) {
              await defer;
              await interaction.editReply({ files: [outfile] }).then(() => {
                rm(outdir, { recursive: true });
              });
              return;
            }
            await defer;
            await interaction.editReply({ content: 'gif creation failed' }).then(() => {
              rm(outdir, { recursive: true });
            });
            return;
          };
        })(interaction, defer) // closure to keep |interaction|
      );

      await defer;
    } catch (error) {
      console.log(error);
      await defer;
      return;
    }
    /*} finally {
      // rm(outdir, { recursive: true })
    }*/
  };
}
