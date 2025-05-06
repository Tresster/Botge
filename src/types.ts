import type { DeepReadonly } from 'ts-essentials';

import type OpenAI from 'openai';
import type { Hit, RecordAny } from 'meilisearch';
import type { Translator } from 'deepl-node';

import type { Platform } from './enums.js';

import type {
  SlashCommandOptionsOnlyBuilder,
  SlashCommandStringOption,
  SlashCommandBooleanOption,
  SlashCommandAttachmentOption,
  SlashCommandIntegerOption,
  EmbedBuilder,
  ActionRowBuilder,
  MessageActionRowComponentBuilder,
  ModalBuilder,
  ApplicationCommandOptionChoiceData
} from 'discord.js';

export type ReadonlyOpenAI = DeepReadonly<OpenAI>;
export type ReadonlyTranslator = DeepReadonly<Translator>;
export type ReadonlyHit = DeepReadonly<Hit>;
export type ReadonlyRecordAny = DeepReadonly<RecordAny>;
export type ReadonlyRegExpExecArray = DeepReadonly<RegExpExecArray>;
export type ReadonlySlashCommandStringOption = DeepReadonly<SlashCommandStringOption>;
export type ReadonlySlashCommandBooleanOption = DeepReadonly<SlashCommandBooleanOption>;
export type ReadonlySlashCommandAttachmentOption = DeepReadonly<SlashCommandAttachmentOption>;
export type ReadonlySlashCommandIntegerOption = DeepReadonly<SlashCommandIntegerOption>;
export type ReadonlySlashCommandOptionsOnlyBuilder = DeepReadonly<SlashCommandOptionsOnlyBuilder>;
export type ReadonlyEmbedBuilder = DeepReadonly<EmbedBuilder>;
export type ReadonlyActionRowBuilderMessageActionRowComponentBuilder = DeepReadonly<
  ActionRowBuilder<MessageActionRowComponentBuilder>
>;
export type ReadonlyModalBuilder = DeepReadonly<ModalBuilder>;
export type ReadonlyApplicationCommandOptionChoiceDataString = DeepReadonly<ApplicationCommandOptionChoiceData<string>>;

export type SevenTVEmoteFile = {
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly format: string;
};

export type SevenTVEmoteInSet = {
  readonly id: string;
  readonly name: string;
  readonly flags: number;
  readonly timestamp: number;
  readonly data: {
    readonly animated: boolean;
    readonly host: {
      readonly url: string;
      readonly files: readonly SevenTVEmoteFile[];
    };
  };
};
export type SevenTVEmoteNotInSet = {
  readonly id: string;
  readonly name: string;
  readonly flags: number;
  readonly animated: boolean;
  readonly host: {
    readonly url: string;
    readonly files: readonly SevenTVEmoteFile[];
  };
  readonly error: string | undefined;
};
export type BTTVEmote = {
  readonly id: string;
  readonly code: string;
  readonly animated: boolean;
};
export type FFZEmote = {
  readonly id: string;
  readonly name: string;
  readonly urls: Readonly<Record<string, string>>;
};
export type TwitchEmote = {
  readonly id: string;
  readonly name: string;
  readonly format: readonly string[];
  readonly theme_mode: readonly string[];
};

export type SevenTVEmotes = {
  readonly emotes: readonly SevenTVEmoteInSet[];
};
export type BTTVPersonalEmotes = {
  readonly channelEmotes: readonly BTTVEmote[];
  readonly sharedEmotes: readonly BTTVEmote[];
};
export type FFZPersonalEmotes = {
  readonly room: {
    readonly set: number;
  };
  readonly sets: Readonly<
    Record<
      string,
      {
        readonly emoticons: readonly FFZEmote[];
      }
    >
  >;
};
export type FFZGlobalEmotes = {
  readonly sets: Readonly<
    Record<
      string,
      {
        readonly emoticons: readonly FFZEmote[];
      }
    >
  >;
};
export type TwitchGlobalEmotes = {
  readonly data: readonly TwitchEmote[];
};

export type TwitchClip = {
  readonly id: string;
  readonly url: string;
  readonly creator_name: string;
  readonly game_id: string;
  readonly title: string;
  readonly view_count: number;
  readonly created_at: string;
  readonly thumbnail_url: string;
};
export type TwitchGame = {
  readonly id: string;
  readonly name: string;
};
export type TwitchUser = {
  readonly id: string;
};

export type TwitchClips = {
  readonly data: readonly TwitchClip[];
  readonly pagination: {
    readonly cursor?: string;
  };
};
export type TwitchGames = {
  readonly data: readonly TwitchGame[];
};
export type TwitchUsers = {
  readonly data: readonly TwitchUser[];
};

export type AddedEmote = {
  readonly url: string;
  readonly alias: string | null;
};

export type Ping = {
  readonly time: number;
  readonly hours: number | null;
  readonly minutes: number | null;
  readonly userId: string;
  readonly channelId: string;
  readonly message: string | null;
};

export type AssetInfo = {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly zeroWidth: boolean;
  readonly animated: boolean;
  readonly width: number | undefined;
  readonly height: number | undefined;
  readonly platform: Platform;
  readonly timestamp: number | undefined;
};

export type DownloadedAsset = {
  readonly filename: string;
  readonly width: number;
  readonly height: number;
  readonly duration: number;
  readonly animated: boolean;
};

export type TwitchGlobalOptions = {
  readonly method: string;
  readonly headers: {
    readonly 'Authorization': string;
    readonly 'Client-Id': string;
  };
};

export type ClientCredentialsGrantFlow = {
  readonly access_token: string;
  readonly expires_in: number;
  readonly token_type: string;
};

export type HstackElement = {
  readonly id: number;
  readonly filterString: () => string;
};

export type NumberOfCurrentPlayers = {
  readonly response: {
    readonly player_count: number;
  };
};

export type TwitchClipMessageBuilderTransformFunctionReturnType = {
  readonly content?: string;
  readonly embeds?: readonly ReadonlyEmbedBuilder[];
  readonly components: readonly ReadonlyActionRowBuilderMessageActionRowComponentBuilder[];
};

export type EmoteMessageBuilderTransformFunctionReturnType = {
  readonly embeds: readonly ReadonlyEmbedBuilder[];
  readonly components: readonly ReadonlyActionRowBuilderMessageActionRowComponentBuilder[];
};
