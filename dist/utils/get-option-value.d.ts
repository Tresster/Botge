/** @format */
import type { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import type { Platform } from '../enums.ts';
export declare function getOptionValue<T = Platform | string | number | boolean>(
  interaction: ChatInputCommandInteraction | AutocompleteInteraction,
  optionName: string,
  transformFunction?: (param: string) => T
): T | undefined;
export declare function getOptionValueWithoutUndefined<T = string | number>(
  interaction: ChatInputCommandInteraction | AutocompleteInteraction,
  optionName: string,
  transformFunction?: (param: string) => T
): T;
