import { join, basename } from 'path';
import fetch from 'node-fetch';
import { writeFile } from 'node:fs/promises';

import type { CachedUrl } from '../../../api/cached-url.js';
import type { AssetInfo, DownloadedAsset } from '../../../types.js';
import { getDimension, getDuration } from './ffprobe-utils.js';

export const DEFAULTDURATION = 0;

export async function downloadAsset(
  outdir: string,
  asset: AssetInfo | string,
  i: number,
  cachedUrl: Readonly<CachedUrl>
): Promise<DownloadedAsset | undefined> {
  if (typeof asset === 'object') {
    const { animated, width, height, url } = asset;

    const [localUrl, ok] = cachedUrl.get(url);
    let filename = localUrl;
    if (!ok) {
      console.log('url not cached: ' + url);
      const response = await fetch(url);
      const buffer: Readonly<Buffer> = Buffer.from(await response.arrayBuffer());
      filename = join(outdir, `${i}_${basename(url)}`);
      await writeFile(filename, buffer);
    }

    const hasWidthAndHeight = width !== undefined && height !== undefined;
    let duration: Promise<number | undefined> | number | undefined = animated ? getDuration(filename) : DEFAULTDURATION;
    let widthAndHeight: Promise<readonly [number, number] | undefined> | readonly [number, number] | undefined =
      hasWidthAndHeight ? [width, height] : getDimension(filename);

    duration = await duration;
    widthAndHeight = await widthAndHeight;
    if (duration === undefined || widthAndHeight === undefined) return undefined;

    return {
      filename: filename,
      width: widthAndHeight[0],
      height: widthAndHeight[1],
      duration: duration,
      animated: duration !== DEFAULTDURATION
    };
  }

  const response = await fetch(asset);
  const buffer: Readonly<Buffer> = Buffer.from(await response.arrayBuffer());
  const format = asset.includes('png') ? 'png' : 'gif';
  const filename = join(outdir, `${i}_${i}.${format}`);
  await writeFile(filename, buffer);

  const _getDuration_ = getDuration(filename);
  const _getDimension_ = getDimension(filename);

  const duration = await _getDuration_;
  const widthAndHeight = await _getDimension_;

  if (duration === undefined || widthAndHeight === undefined) return undefined;

  return {
    filename: filename,
    width: widthAndHeight[0],
    height: widthAndHeight[1],
    duration: duration,
    animated: duration !== DEFAULTDURATION
  };
}
