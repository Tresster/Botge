/** @format */
import { type Job } from 'node-schedule';
import type { Client } from 'discord.js';
import type { PingsDatabase } from '../api/ping-database.ts';
export declare function registerPings(
  client: Client,
  pingsDataBase: Readonly<PingsDatabase>,
  scheduledJobs: Readonly<Job>[]
): Promise<void>;
