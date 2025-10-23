/** @format */
import type { AssetInfo } from '../../../types.ts';
import { Platform } from '../../../enums.ts';
export declare function maxPlatformSize(platform: Platform): number;
export declare function emoteSizeChange(url: string, size: number, platform: Platform): string;
export declare function assetSizeChange(asset: AssetInfo, size: number): Promise<AssetInfo>;
