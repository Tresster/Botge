import scheduler from 'node-schedule';

import type { Client, TextChannel } from 'discord.js';

import { getContent, ContentType } from '../message-builders/ping-message-builder.ts';
import { hoursAndMinutesToMiliseconds } from '../command-handlers/pingme.ts';
import type { PingsDatabase } from '../api/ping-database.ts';

function milisecondsToHoursAndMinutes(miliseconds: number): string {
  const hours = Math.floor(miliseconds / 3600000);
  const minutes = Math.floor((miliseconds % 3600000) / 60000);

  const hoursText = hours > 0 ? `${hours} hours and ` : '';
  const minutesText = hours === 0 && minutes === 0 ? 'less than a minute' : `${minutes} minute`;

  return `${hoursText}${minutesText}`;
}

export async function registerPings(client: Client, pingsDataBase: Readonly<PingsDatabase>): Promise<void> {
  const pings = pingsDataBase.getAll();

  for (const ping of pings) {
    const { time, hours, minutes, channelId } = ping;

    const timeMilliseconds = time + hoursAndMinutesToMiliseconds(hours ?? 0, minutes ?? 0);
    const pingDate = new Date(timeMilliseconds);

    let channel: TextChannel | undefined = undefined;
    try {
      channel = (await client.channels.fetch(channelId)) as TextChannel;
    } catch {
      return;
    }

    const difference = timeMilliseconds - Date.now();
    const pingedContent = getContent(ping, ContentType.Pinged);
    if (difference > 0) {
      scheduler.scheduleJob(pingDate, async () => {
        try {
          await channel.send(pingedContent);
          pingsDataBase.delete(ping);
        } catch (error) {
          console.log(`Error at a scheduled job --> ${error instanceof Error ? error.message : String(error)}`);
        }
      });
    } else {
      await channel.send(
        `${pingedContent}\nSorry for the bot downtime! The ping was delivered with a ${milisecondsToHoursAndMinutes(-difference)} delay!`
      );
      pingsDataBase.delete(ping);
    }
  }
}
