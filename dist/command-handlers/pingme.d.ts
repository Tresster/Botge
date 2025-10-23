/** @format */
import type { Client, ChatInputCommandInteraction } from 'discord.js';
import { PingForPingMeMessageBuilder } from '../message-builders/ping-for-ping-me-message-builder.ts';
import type { PingsDatabase } from '../api/ping-database.ts';
import type { Guild } from '../guild.ts';
import type { Job } from 'node-schedule';
export declare function daysAndhoursAndMinutesToMiliseconds(days: number, hours: number, minutes: number): number;
export declare function pingMeHandler(
  pingsDataBase: Readonly<PingsDatabase>,
  pingMessageBuilders: Readonly<PingForPingMeMessageBuilder>[],
  client: Client,
  scheduledJobs: Readonly<Job>[]
): (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>) => Promise<void>;
