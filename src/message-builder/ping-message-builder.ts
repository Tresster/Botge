import { scheduleJob, type Job } from 'node-schedule';
import {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  type MessageActionRowComponentBuilder,
  type ChatInputCommandInteraction,
  type TextChannel
} from 'discord.js';

import type { PingsDatabase } from '../api/ping-database.js';
import type {
  Ping,
  ReadonlyActionRowBuilderMessageActionRowComponentBuilder,
  PingMessageBuilderTransformFunctionReturnType,
  PingMessageBuilderReplies
} from '../types.js';
import { getCustomId } from './base.js';

export enum ContentType {
  PingRegistered = 0,
  Pinged = 1
}

function getPingableUserId(userId: string): string {
  return `<@${userId}>`;
}

export function getContent(ping: Ping, contentType: ContentType): string {
  const { hours, minutes, userId, message, userIds, userIdRemoved } = ping;

  const contentTimePart = ((): string => {
    let contentTimePart_ = '';

    if (hours !== null) {
      if (hours === 1) contentTimePart_ += '1 hour';
      else contentTimePart_ += `${hours} hours`;
    }
    if (minutes !== null) {
      if (contentTimePart_ !== '') contentTimePart_ += ' and ';

      if (minutes === 1) contentTimePart_ += '1 minute';
      else contentTimePart_ += `${minutes} minutes`;
    }

    return contentTimePart_;
  })();

  let content = '';
  if (contentType === ContentType.PingRegistered) {
    content = `The ping has been registered for ${contentTimePart}.`;

    if (userIdRemoved !== null && userIdRemoved) content += ' The original command user was removed from the ping.';
  } else {
    content = `You have been pinged ${getPingableUserId(userId)} after ${contentTimePart}!`;

    if (userIdRemoved !== null && userIdRemoved)
      content = `The original command user was removed from the ping. The ping was delivered after ${contentTimePart}!`;
  }

  if (message !== null) content += ` With the message: ${message}.`;
  if (userIds !== null && userIds.length !== 0) {
    const pingableUserIds = userIds.map((userId_) => getPingableUserId(userId_)).join(', ');
    content += `\nPings: ${pingableUserIds}.`;
  }

  return content;
}

export const PING_ME_AS_WELL_BUTTON_BASE_CUSTOM_ID = 'pingMeAsWellButton';
export const REMOVE_ME_FROM_PING_BUTTON_BASE_CUSTOM_ID = 'removeMeFromPingListButton';
export const DELETE_PING_BUTTON_BASE_CUSTOM_ID = 'deletePingButton';
const CLEANUP_MINUTES = 4;

export class PingMessageBuilder {
  public static readonly messageBuilderType = 'Ping';
  static readonly #emptyPingMessageBuilderReplies = {
    reply: undefined,
    buttonReply: undefined,
    deletionEvent: false
  } as PingMessageBuilderReplies;
  static readonly #pressedButtonPingMessageBuilderReplies = {
    reply: undefined,
    buttonReply: `Please wait at least ${CLEANUP_MINUTES} minutes before pressing the same button again.`,
    deletionEvent: false
  } as PingMessageBuilderReplies;
  static #staticCounter = 0;

  readonly #counter: number;
  readonly #interaction: ChatInputCommandInteraction;
  readonly #pingDate: Readonly<Date>;
  readonly #channel: TextChannel;
  readonly #row: ReadonlyActionRowBuilderMessageActionRowComponentBuilder;
  readonly #pressedPingMeAsWell: Map<string, number> = new Map<string, number>();
  readonly #pressedRemoveMeFromPing: Map<string, number> = new Map<string, number>();
  readonly #cleanupPressedMapsJob: Readonly<Job> = scheduleJob('0 */1 * * * *', () => {
    this.#cleanUpPressedMaps();
  });
  #ping: Ping;
  #job: Readonly<Job> | undefined = undefined;

  public constructor(
    interaction: ChatInputCommandInteraction,
    ping: Ping,
    pingDate: Readonly<Date>,
    channel: TextChannel
  ) {
    this.#counter = PingMessageBuilder.#staticCounter++;
    this.#interaction = interaction;
    this.#ping = ping;
    this.#pingDate = pingDate;
    this.#channel = channel;

    const { messageBuilderType } = PingMessageBuilder;
    this.#row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(getCustomId(PING_ME_AS_WELL_BUTTON_BASE_CUSTOM_ID, messageBuilderType, this.#counter))
        .setLabel('Ping me as well!')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(getCustomId(REMOVE_ME_FROM_PING_BUTTON_BASE_CUSTOM_ID, messageBuilderType, this.#counter))
        .setLabel('Remove me from ping')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(getCustomId(DELETE_PING_BUTTON_BASE_CUSTOM_ID, messageBuilderType, this.#counter))
        .setLabel('Delete ping')
        .setStyle(ButtonStyle.Danger)
    );
  }

  public get counter(): number {
    return this.#counter;
  }
  public get interaction(): ChatInputCommandInteraction {
    return this.#interaction;
  }
  public get cleanupPressedMapsJob(): Readonly<Job> {
    return this.#cleanupPressedMapsJob;
  }

  public registerPing(
    pingsDataBase: Readonly<PingsDatabase>
  ): PingMessageBuilderTransformFunctionReturnType | undefined {
    if (this.#isCriticalTimeLeftOrIsPassed()) return undefined;
    if (this.#job !== undefined) return undefined;

    this.#job = this.#schedulePing(pingsDataBase);
    pingsDataBase.insert(this.#ping);

    return this.#transformFunction();
  }

  public addUserId(pingsDataBase: Readonly<PingsDatabase>, userId: string): PingMessageBuilderReplies {
    const emptyPingMessageBuilderReplies = PingMessageBuilder.#emptyPingMessageBuilderReplies;

    if (this.#isCriticalTimeLeftOrIsPassed()) return emptyPingMessageBuilderReplies;
    if (this.#job === undefined) return emptyPingMessageBuilderReplies;
    if (this.#ping.userId === userId) {
      if (this.#ping.userIdRemoved !== null && !this.#ping.userIdRemoved) return emptyPingMessageBuilderReplies;

      if (this.#pressedPingMeAsWell.has(userId)) return PingMessageBuilder.#pressedButtonPingMessageBuilderReplies;

      this.#updatePing(pingsDataBase, undefined, false);
      this.#pressedPingMeAsWell.set(userId, Date.now());
      return {
        reply: this.#transformFunction(),
        buttonReply: undefined,
        deletionEvent: false
      } as PingMessageBuilderReplies;
    }

    if (this.#pressedPingMeAsWell.has(userId)) return PingMessageBuilder.#pressedButtonPingMessageBuilderReplies;

    const { userIds } = this.#ping;
    const newUserIds: string[] = [userId];
    if (userIds !== null) {
      if (userIds.includes(userId)) return emptyPingMessageBuilderReplies;

      newUserIds.unshift(...userIds);
    }

    this.#updatePing(pingsDataBase, newUserIds);
    this.#pressedPingMeAsWell.set(userId, Date.now());
    return {
      reply: this.#transformFunction(),
      buttonReply: undefined,
      deletionEvent: false
    } as PingMessageBuilderReplies;
  }

  public removeUserId(pingsDataBase: Readonly<PingsDatabase>, userId: string): PingMessageBuilderReplies {
    const emptyPingMessageBuilderReplies = PingMessageBuilder.#emptyPingMessageBuilderReplies;

    if (this.#isCriticalTimeLeftOrIsPassed()) return emptyPingMessageBuilderReplies;
    if (this.#job === undefined) return emptyPingMessageBuilderReplies;

    const { userIds } = this.#ping;
    if (userIds === null) {
      if (this.#ping.userId === userId)
        return {
          reply: undefined,
          buttonReply:
            "You cannot remove yourself from the ping if no one else is added to it.\nPlease use the 'Delete ping' button.",
          deletionEvent: false
        } as PingMessageBuilderReplies;

      return emptyPingMessageBuilderReplies;
    }
    if (this.#ping.userId === userId) {
      if (this.#pressedRemoveMeFromPing.has(userId)) return PingMessageBuilder.#pressedButtonPingMessageBuilderReplies;

      this.#updatePing(pingsDataBase, undefined, true);
      this.#pressedRemoveMeFromPing.set(userId, Date.now());
      return {
        reply: this.#transformFunction(),
        buttonReply: undefined,
        deletionEvent: false
      } as PingMessageBuilderReplies;
    }

    if (this.#pressedRemoveMeFromPing.has(userId)) return PingMessageBuilder.#pressedButtonPingMessageBuilderReplies;

    const userIdIndex = userIds.findIndex((userId_) => userId_ === userId);
    if (userIdIndex === -1) return emptyPingMessageBuilderReplies;

    const newUserIds = [...userIds];
    newUserIds.splice(userIdIndex, 1);

    const { userIdRemoved } = this.#ping;
    if (newUserIds.length === 0 && userIdRemoved !== null && userIdRemoved) return this.#deletePing(pingsDataBase);

    this.#updatePing(pingsDataBase, newUserIds);
    this.#pressedRemoveMeFromPing.set(userId, Date.now());
    return {
      reply: this.#transformFunction(),
      buttonReply: undefined,
      deletionEvent: false
    } as PingMessageBuilderReplies;
  }

  public deletePing(pingsDataBase: Readonly<PingsDatabase>): PingMessageBuilderReplies {
    const emptyPingMessageBuilderReplies = PingMessageBuilder.#emptyPingMessageBuilderReplies;

    if (this.#isCriticalTimeLeftOrIsPassed()) return emptyPingMessageBuilderReplies;
    if (this.#job === undefined) return emptyPingMessageBuilderReplies;

    const { userIds } = this.#ping;
    if (userIds !== null && userIds.length !== 0)
      return {
        reply: undefined,
        buttonReply:
          "You cannot delete the ping because people have been added to it.\nPlease use the 'Remove me from ping' button.",
        deletionEvent: false
      } as PingMessageBuilderReplies;

    return this.#deletePing(pingsDataBase);
  }

  #schedulePing(pingsDataBase: Readonly<PingsDatabase>): Readonly<Job> {
    const pingedContent = getContent(this.#ping, ContentType.Pinged);

    return scheduleJob(this.#pingDate, async () => {
      try {
        await this.#channel.send(pingedContent);
        pingsDataBase.delete(this.#ping);
      } catch (error) {
        console.log(`Error at a scheduled job --> ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  #updatePing(
    pingsDataBase: Readonly<PingsDatabase>,
    newUserIds?: readonly string[],
    newUserIdRemoved?: boolean
  ): void {
    if (this.#job === undefined) return;

    const oldUserIds = this.#ping.userIds;
    const oldUserIdRemoved = this.#ping.userIdRemoved;

    const newUserIds_ = newUserIds !== undefined ? (newUserIds.length !== 0 ? newUserIds : null) : oldUserIds;
    const newUserIdRemoved_ = newUserIdRemoved ?? oldUserIdRemoved;
    const newPing = {
      ...this.#ping,
      userIds: newUserIds_,
      userIdRemoved: newUserIdRemoved_
    } as Ping;
    this.#ping = newPing;

    this.#job.cancel();
    this.#job = this.#schedulePing(pingsDataBase);
    if (newUserIds !== undefined) pingsDataBase.updateUserIds(this.#ping);
    if (newUserIdRemoved !== undefined) pingsDataBase.updateUserIdRemoved(this.#ping);
  }

  #deletePing(pingsDataBase: Readonly<PingsDatabase>): PingMessageBuilderReplies {
    if (this.#job === undefined) return PingMessageBuilder.#emptyPingMessageBuilderReplies;

    this.#job.cancel();
    pingsDataBase.delete(this.#ping);

    return {
      reply: {
        content: '❌ This ping has been deleted.',
        components: []
      } as PingMessageBuilderTransformFunctionReturnType,
      buttonReply: undefined,
      deletionEvent: true
    } as PingMessageBuilderReplies;
  }

  #transformFunction(): PingMessageBuilderTransformFunctionReturnType {
    return {
      content: getContent(this.#ping, ContentType.PingRegistered),
      components: [this.#row]
    } as PingMessageBuilderTransformFunctionReturnType;
  }

  #isCriticalTimeLeftOrIsPassed(): boolean {
    const dateNow = Date.now();
    return dateNow >= this.#pingDate.getTime() - 25000;
  }

  #cleanUpPressedMaps(): void {
    const timeNow = Date.now();

    for (const [userId, pressedAt] of this.#pressedPingMeAsWell) {
      const difference = timeNow - pressedAt;
      if (difference > CLEANUP_MINUTES * 60000) this.#pressedPingMeAsWell.delete(userId);
    }

    for (const [userId, pressedAt] of this.#pressedRemoveMeFromPing) {
      const difference = timeNow - pressedAt;
      if (difference > CLEANUP_MINUTES * 60000) this.#pressedRemoveMeFromPing.delete(userId);
    }
  }
}
