import { config } from 'dotenv';

import { REST, Routes } from 'discord.js';

import { commands } from './commands.ts';

config();
const { APP_ID, DISCORD_TOKEN } = process.env;

try {
  console.log('Discord commands updating.');

  if (DISCORD_TOKEN === undefined || APP_ID === undefined) {
    console.log('DISCORD_TOKEN and APP_ID required. exiting.');
    process.exit(1);
  }

  const rest: Readonly<REST> = new REST().setToken(DISCORD_TOKEN);
  await rest.put(Routes.applicationCommands(APP_ID), { body: commands });
  console.log('Discord commands updated.');
} catch (error) {
  console.error(`Error updating discord commands: ${error instanceof Error ? error.message : String(error)}`);
}
