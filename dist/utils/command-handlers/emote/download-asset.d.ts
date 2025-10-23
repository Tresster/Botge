/** @format */
import type { CachedUrl } from '../../../api/cached-url.ts';
import type { AssetInfo, DownloadedAsset } from '../../../types.ts';
export declare const DEFAULTDURATION = 0;
export declare function downloadAsset(
  outdir: string,
  asset: AssetInfo | string,
  i: number,
  cachedUrl: Readonly<CachedUrl>
): Promise<DownloadedAsset | undefined>;
