import dotenv from 'dotenv';
import process from 'node:process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { Md5 } from 'ts-md5';

import { REST, Routes } from 'discord.js';

import { commands } from './commands.js';

dotenv.config();
const { APP_ID, DISCORD_TOKEN } = process.env;

export async function updateCommands(lockFilePath: string): Promise<void> {
  if (DISCORD_TOKEN === undefined || APP_ID === undefined) throw new Error('DISCORD_TOKEN and APP_ID required.');

  const currentCommands = ((): string | undefined => {
    if (!existsSync(lockFilePath)) return undefined;
    return readFileSync(lockFilePath, 'utf8');
  })();
  const newCommands = Md5.hashStr(JSON.stringify(commands));

  if (currentCommands !== undefined && currentCommands === newCommands) {
    console.log('No commands change detected.');
    return;
  }

  console.log('Discord commands updating.');

  writeFileSync(lockFilePath, newCommands, { encoding: 'utf8', flag: 'w' });

  const rest: Readonly<REST> = new REST().setToken(DISCORD_TOKEN);
  await rest.put(Routes.applicationCommands(APP_ID), { body: commands });

  console.log('Discord commands updated.');
}
