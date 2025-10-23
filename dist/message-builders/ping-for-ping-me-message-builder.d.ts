/** @format */
import { type Job } from 'node-schedule';
import { type ChatInputCommandInteraction, type TextChannel } from 'discord.js';
import type { PingsDatabase } from '../api/ping-database.ts';
import type {
  Ping,
  ReadonlyActionRowBuilderMessageActionRowComponentBuilder,
  PingForPingMeMessageBuilderTransformFunctionReturnType,
  PingForPingMeMessageBuilderReplies
} from '../types.ts';
export declare enum ContentType {
  PingRegistered = 0,
  Pinged = 1
}
export declare function getContent(ping: Ping, contentType: ContentType): string;
export declare const PING_ME_AS_WELL_BUTTON_FOR_PING_ME_BASE_CUSTOM_ID = 'pingMeAsWellButtonForPingMe';
export declare const REMOVE_ME_FROM_PING_BUTTON_FOR_PING_ME_BASE_CUSTOM_ID = 'removeMeFromPingButtonForPingMe';
export declare const DELETE_PING_BUTTON_FOR_PING_ME_BASE_CUSTOM_ID = 'deletePingButtonForPingMe';
export declare class PingForPingMeMessageBuilder {
  #private;
  static readonly messageBuilderTypeForPingMe = 'PingForPingMeForPingMe';
  static readonly messageBuilderTypeForPingList = 'PingForPingMeForPingList';
  constructor(
    interaction: ChatInputCommandInteraction,
    ping: Ping,
    pingDate: Readonly<Date>,
    channel: TextChannel,
    scheduleJobs: Readonly<Job>[],
    messageBuilderType: string
  );
  get ping(): Ping;
  get row(): ReadonlyActionRowBuilderMessageActionRowComponentBuilder;
  get counter(): number;
  get interaction(): ChatInputCommandInteraction;
  get cleanupPressedMapsJob(): Readonly<Job>;
  registerPing(
    pingsDataBase: Readonly<PingsDatabase>
  ): PingForPingMeMessageBuilderTransformFunctionReturnType | undefined;
  addUserId(pingsDataBase: Readonly<PingsDatabase>, userId: string): PingForPingMeMessageBuilderReplies;
  removeUserId(pingsDataBase: Readonly<PingsDatabase>, userId: string): PingForPingMeMessageBuilderReplies;
  deletePing(pingsDataBase: Readonly<PingsDatabase>): PingForPingMeMessageBuilderReplies;
}
