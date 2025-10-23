/** @format */
import type { SevenTVEmoteInSet, SevenTVEmoteNotInSet, BTTVEmote, FFZEmote, TwitchEmote, AssetInfo } from '../types.ts';
export declare function sevenTVInSetToAsset(emote: SevenTVEmoteInSet, size?: number): AssetInfo;
export declare function sevenTVNotInSetToAsset(emote: Readonly<SevenTVEmoteNotInSet>, size?: number): AssetInfo;
export declare function bttvToAsset(emote: BTTVEmote): AssetInfo;
export declare function ffzToAsset(emote: FFZEmote): AssetInfo;
export declare function twitchToAsset(emote: TwitchEmote): AssetInfo;
