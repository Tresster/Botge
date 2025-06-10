import { SlashCommandBuilder, type RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';

import type {
  ReadonlySlashCommandOptionsOnlyBuilder,
  ReadonlySlashCommandStringOption,
  ReadonlySlashCommandBooleanOption,
  ReadonlySlashCommandAttachmentOption,
  ReadonlySlashCommandIntegerOption
} from './types.ts';

const emote: ReadonlySlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
  .setName('emote')
  .setDescription('Get an emote')
  .addStringOption((option: ReadonlySlashCommandStringOption) =>
    option.setName('name').setDescription("The emote's name").setRequired(true).setAutocomplete(true)
  )
  .addIntegerOption((option: ReadonlySlashCommandIntegerOption) =>
    option.setName('size').setDescription("The emote's size").setAutocomplete(true)
  );

const emotes: ReadonlySlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
  .setName('emotes')
  .setDescription(
    'Overlay and/or create a horizontal stack of emotes/Discord built-in emojis/external images (png/gif)'
  )
  .addStringOption((option: ReadonlySlashCommandStringOption) =>
    option
      .setName('emotes')
      .setDescription('Inputs separated by space. Partial emote name is sufficient')
      .setRequired(true)
  )
  .addBooleanOption((option: ReadonlySlashCommandBooleanOption) =>
    option
      .setName('fullsize')
      .setDescription(
        'Whether to use the full size of the inputs or not. External image: full size, emote: highest size'
      )
  )
  .addBooleanOption((option: ReadonlySlashCommandBooleanOption) =>
    option.setName('stretch').setDescription('Whether to stretch the overlaying emotes instead of centering them')
  );

const emotelist: ReadonlySlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
  .setName('emotelist')
  .setDescription('Browse through the queried emotes')
  .addStringOption((option: ReadonlySlashCommandStringOption) =>
    option.setName('query').setDescription('The query').setAutocomplete(true)
  )
  .addStringOption((option: ReadonlySlashCommandStringOption) =>
    option.setName('platform').setDescription('The platform of the queried emotes').setAutocomplete(true)
  )
  .addStringOption((option: ReadonlySlashCommandStringOption) =>
    option.setName('animated').setDescription('Whether the queried emotes should be animated').setAutocomplete(true)
  )
  .addStringOption((option: ReadonlySlashCommandStringOption) =>
    option
      .setName('overlaying')
      .setDescription('Whether the queried emotes should be overlaying (zero-width)')
      .setAutocomplete(true)
  );

const clip: ReadonlySlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
  .setName('clip')
  .setDescription('Get a single clip or browse through multiple clips')
  .addStringOption((option: ReadonlySlashCommandStringOption) =>
    option.setName('title').setDescription('The clip title').setAutocomplete(true)
  )
  .addStringOption((option: ReadonlySlashCommandStringOption) =>
    option.setName('clipper').setDescription('The Twitch username of the clipper').setAutocomplete(true)
  )
  .addStringOption((option: ReadonlySlashCommandStringOption) =>
    option.setName('category').setDescription('The category of the clips').setAutocomplete(true)
  )
  .addStringOption((option: ReadonlySlashCommandStringOption) =>
    option
      .setName('sortby')
      .setDescription('Sort. Default: date created (newest first)')
      .addChoices({ name: 'Views', value: 'views' }, { name: 'Shuffle the list', value: 'shuffle' })
  );

const addemote: ReadonlySlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
  .setName('addemote')
  .setDescription('Add an emote')
  .addStringOption((option: ReadonlySlashCommandStringOption) =>
    option.setName('url').setDescription('The 7TV link of the emote').setRequired(true)
  )
  .addStringOption((option: ReadonlySlashCommandStringOption) =>
    option.setName('name').setDescription('Add the emote with this name instead')
  );

const chatgpt: ReadonlySlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
  .setName('chatgpt')
  .setDescription('Send a prompt to ChatGPT and receive a response')
  .addStringOption((option: ReadonlySlashCommandStringOption) =>
    option.setName('prompt').setDescription('The prompt to send').setRequired(true)
  )
  .addStringOption((option: ReadonlySlashCommandStringOption) =>
    option.setName('image').setDescription('The link to an image for ChatGPT to analyse')
  )
  .addStringOption((option: ReadonlySlashCommandStringOption) =>
    option
      .setName('instruction')
      .setDescription('High-level instruction for controlling response. Default: no instruction')
      .addChoices({ name: 'Be concise', value: 'Be concise.' })
  );

const gemini: ReadonlySlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
  .setName('gemini')
  .setDescription('Send a prompt to Gemini and receive a response')
  .addStringOption((option: ReadonlySlashCommandStringOption) =>
    option.setName('prompt').setDescription('The prompt to send').setRequired(true)
  );

const translate: ReadonlySlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
  .setName('translate')
  .setDescription('Translate text to english. Auto-detects language')
  .addStringOption((option: ReadonlySlashCommandStringOption) =>
    option.setName('text').setDescription('The text to translate').setRequired(true)
  );

const shortestuniquesubstrings: ReadonlySlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
  .setName('shortestuniquesubstrings')
  .setDescription('Get the shortest unique substring(s) of emote(s)')
  .addStringOption((option: ReadonlySlashCommandStringOption) =>
    option.setName('emotes').setDescription('Emote name(s). Separated by space').setRequired(true).setAutocomplete(true)
  )
  .addStringOption((option: ReadonlySlashCommandStringOption) =>
    option
      .setName('format')
      .setDescription('Text/emote browser. Default: text')
      .setChoices([{ name: 'Emote browser', value: 'emoteBrowser' }])
  )
  .addBooleanOption((option: ReadonlySlashCommandBooleanOption) =>
    option.setName('ephemeral').setDescription('whether to output the result so only you can see it')
  );

const transient: ReadonlySlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
  .setName('transient')
  .setDescription('Send a message and delete it after the specified time')
  .addStringOption((option: ReadonlySlashCommandStringOption) =>
    option.setName('text').setDescription('The text to send')
  )
  .addAttachmentOption((option: ReadonlySlashCommandAttachmentOption) =>
    option.setName('attachment').setDescription('The attachment to send')
  )
  .addIntegerOption((option: ReadonlySlashCommandIntegerOption) =>
    option.setName('duration').setDescription('The duration in seconds before deletion. Default: 3, maximum: 600')
  );

const findTheEmoji: ReadonlySlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
  .setName('findtheemoji')
  .setDescription('Generates an emoji grid, where each emoji is in a spoiler tag')
  .addStringOption((option: ReadonlySlashCommandStringOption) =>
    option.setName('emoji').setDescription('The emoji to find. Non-animated server emoji')
  )
  .addIntegerOption((option: ReadonlySlashCommandIntegerOption) =>
    option.setName('size').setDescription('The size of the grid. Default: 5x5, minimum: 3x3, maximum: 7x7')
  );

const pingMe: ReadonlySlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
  .setName('pingme')
  .setDescription('Pings you after the specified time')
  .addIntegerOption((option: ReadonlySlashCommandIntegerOption) =>
    option.setName('days').setDescription('The days to wait before pinging you')
  )
  .addIntegerOption((option: ReadonlySlashCommandIntegerOption) =>
    option.setName('hours').setDescription('The hours to wait before pinging you')
  )
  .addIntegerOption((option: ReadonlySlashCommandIntegerOption) =>
    option.setName('minutes').setDescription('The minutes to wait before pinging you')
  )
  .addStringOption((option: ReadonlySlashCommandStringOption) =>
    option.setName('message').setDescription('The message to display when pinging you')
  );

const poe2: ReadonlySlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
  .setName('poe2')
  .setDescription('Get POE2 steam stats');

const settings: ReadonlySlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
  .setName('settings')
  .setDescription('Settings for configuring the behavior of the bot in this server. Permission required');

export const commands: readonly Readonly<RESTPostAPIChatInputApplicationCommandsJSONBody>[] = [
  emote.toJSON(),
  emotes.toJSON(),
  emotelist.toJSON(),
  clip.toJSON(),
  addemote.toJSON(),
  chatgpt.toJSON(),
  gemini.toJSON(),
  translate.toJSON(),
  shortestuniquesubstrings.toJSON(),
  transient.toJSON(),
  findTheEmoji.toJSON(),
  pingMe.toJSON(),
  poe2.toJSON(),
  settings.toJSON()
];
