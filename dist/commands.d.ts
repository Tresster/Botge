/** @format */
import {
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  type RESTPostAPIContextMenuApplicationCommandsJSONBody
} from 'discord.js';
export declare const COMMAND_NAMES: {
  readonly emote: 'emote';
  readonly emotes: 'emotes';
  readonly emoteList: 'emotelist';
  readonly clip: 'clip';
  readonly addEmote: 'addemote';
  readonly chatGpt: 'chatgpt';
  readonly gemini: 'gemini';
  readonly translate: 'translate';
  readonly shortestUniqueSubstrings: 'shortestuniquesubstrings';
  readonly transient: 'transient';
  readonly findTheEmoji: 'findtheemoji';
  readonly pingMe: 'pingme';
  readonly poe2: 'poe2';
  readonly settings: 'settings';
  readonly pingList: 'pinglist';
};
export declare const CONTEXT_MENU_COMMAND_NAMES: {
  readonly chatGptExplain: 'ChatGPT Explain';
};
export declare const PING_LIST: {
  readonly type: {
    readonly own: 'own';
    readonly every: 'every';
  };
  readonly timezone: 'timezone';
};
export declare const commands: readonly (
  | Readonly<RESTPostAPIChatInputApplicationCommandsJSONBody>
  | Readonly<RESTPostAPIContextMenuApplicationCommandsJSONBody>
)[];
