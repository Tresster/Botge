/** @format */

import type { ChatInputCommandInteraction } from 'discord.js';
import { describe, expect, test } from 'vitest';

import { getAllSubstrings } from '../src/command-handlers/shortest-unique-substrings';
import { TwitchClipMessageBuilder } from '../src/message-builders/twitch-clip-message-builder';
import type { TwitchClip } from '../src/types';

const TWITCH_CLIPS_LENGTH = 4;
if (TWITCH_CLIPS_LENGTH < 4) throw new Error('TWITCH_CLIPS_LENGTH at least 4.');

function getTestTitle(index: number): string {
  return `testTitle${index}`;
}

describe('TwitchClipMessageBuilder', () => {
  const chatInputCommandInteraction = {} as ChatInputCommandInteraction;
  const twitchClips = ((): readonly TwitchClip[] => {
    const twitchClips_: TwitchClip[] = [];

    for (let i = 0; i < TWITCH_CLIPS_LENGTH; i++) {
      const twitchClip = {
        title: getTestTitle(i),
        view_count: 1,
        creator_name: 'testCreator',
        game_id: 'testGameId',
        created_at: 'testCreatedAt'
      } as TwitchClip;
      twitchClips_.push(twitchClip);
    }

    return twitchClips_;
  })();
  const twitchClipMessageBuilder = new TwitchClipMessageBuilder(chatInputCommandInteraction, twitchClips, undefined);

  test('jumpToIdentifer exact', () => {
    twitchClipMessageBuilder.first();

    expect(twitchClipMessageBuilder.jumpToIdentifer(getTestTitle(1))).toBeDefined();
  });

  test('jumpToIdentifer lowercase', () => {
    expect(twitchClipMessageBuilder.jumpToIdentifer(getTestTitle(2).toLowerCase())).toBeDefined();
  });

  test('jumpToIdentifer includes', () => {
    const identifier = getTestTitle(0);
    const allSubstrings = getAllSubstrings(identifier);

    for (const substring of allSubstrings) {
      expect(twitchClipMessageBuilder.jumpToIdentifer(substring)).toBeDefined();
      twitchClipMessageBuilder.last();
    }
  });
});
