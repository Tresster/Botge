/** @format */
import { type ModalSubmitInteraction } from 'discord.js';
import { PingForPingListMessageBuilder } from '../message-builders/ping-for-ping-list-message-builder.ts';
import { TwitchClipMessageBuilder } from '../message-builders/twitch-clip-message-builder.ts';
import { EmoteMessageBuilder } from '../message-builders/emote-message-builder.ts';
import type { BroadcasterNameAndPersonalEmoteSetsDatabase } from '../api/broadcaster-name-and-personal-emote-sets-database.ts';
import type { TwitchApi } from '../api/twitch-api.ts';
import type { UsersDatabase } from '../api/user.js';
import type { Guild } from '../guild.ts';
import { User } from '../user.js';
export declare function modalSubmitHandler(
  twitchClipMessageBuilders: readonly Readonly<TwitchClipMessageBuilder>[],
  emoteMessageBuilders: readonly Readonly<EmoteMessageBuilder>[],
  pingForPingListMessageBuilders: readonly Readonly<PingForPingListMessageBuilder>[],
  guild: Readonly<Guild> | undefined,
  broadcasterNameAndPersonalEmoteSetsDatabase: Readonly<BroadcasterNameAndPersonalEmoteSetsDatabase>,
  usersDatabase: Readonly<UsersDatabase>,
  twitchApi: Readonly<TwitchApi> | undefined,
  guilds: readonly Readonly<Guild>[],
  users: Readonly<User>[]
): (interaction: ModalSubmitInteraction) => Promise<void>;
