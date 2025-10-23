/** @format */
import type { Job } from 'node-schedule';
import type { ChatInputCommandInteraction, Client } from 'discord.js';
import { PingForPingListMessageBuilder } from '../message-builders/ping-for-ping-list-message-builder.ts';
import type { PingsDatabase } from '../api/ping-database.ts';
import type { Guild } from '../guild.ts';
export declare function pingListHandler(
  pingsDataBase: Readonly<PingsDatabase>,
  pingForPingListMessageBuilders: Readonly<PingForPingListMessageBuilder>[],
  client: Client,
  scheduledJobs: Readonly<Job>[]
): (interaction: ChatInputCommandInteraction, guild: Readonly<Guild>) => Promise<void>;
