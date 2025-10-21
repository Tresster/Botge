/** @format */

import { describe, expect, test } from 'vitest';

import {
  getSevenTvApiUrlFromSevenTvEmoteSetLink,
  getBttvApiUrlFromBroadcasterName,
  getFfzApiUrlFromBroadcasterName
} from '../src/utils/interaction-handlers/get-api-url';

import { newTwitchApi } from '../src/utils/constructors/new-twitch-api';

const { TWITCH_CLIENT_ID, TWITCH_SECRET } = process.env;

describe('Get API Url', () => {
  const broadcasterNameValid = 'CuteDog_';
  const broadcasterNameInvalid = 'invalidBroadcasterName';

  describe('getSevenTvApiUrlFromSevenTvEmoteSetLink', () => {
    test('valid broadcasterName & valid emote set URL', async () => {
      const emoteSetId = '01FDMJPSF8000CJ4MDR2FNZEQ3';
      const sevenTvEmoteSetLink = `https://7tv.app/emote-sets/${emoteSetId}`;
      const sevenTvApiUrl = `https://7tv.io/v3/emote-sets/${emoteSetId}`;

      const sevenTvApiUrlMessage = await getSevenTvApiUrlFromSevenTvEmoteSetLink(sevenTvEmoteSetLink);
      const { type } = sevenTvApiUrlMessage;

      expect(type).toBe('success');
      if (type !== 'success') return;
      expect(sevenTvApiUrlMessage.url).toBe(sevenTvApiUrl);
      expect(sevenTvApiUrlMessage.ownerUsername).toBe(broadcasterNameValid.toLowerCase());
    });

    test('invalid emote set URL', async () => {
      const emoteSetId = 'invaledEmoteSetUrl';
      const sevenTvEmoteSetLink = `https://7tv.app/emote-sets/${emoteSetId}`;

      const sevenTvApiUrlMessage = await getSevenTvApiUrlFromSevenTvEmoteSetLink(sevenTvEmoteSetLink);

      expect(sevenTvApiUrlMessage.type).toBe('error');
    });

    test('not URL', async () => {
      const sevenTvEmoteSetLink = 'notUrl';

      const sevenTvApiUrlMessage = await getSevenTvApiUrlFromSevenTvEmoteSetLink(sevenTvEmoteSetLink);

      expect(sevenTvApiUrlMessage.type).toBe('error');
    });

    test('not emote set URL', async () => {
      const sevenTvEmoteSetLink = 'https://www.google.com';

      const sevenTvApiUrlMessage = await getSevenTvApiUrlFromSevenTvEmoteSetLink(sevenTvEmoteSetLink);

      expect(sevenTvApiUrlMessage.type).toBe('error');
    });
  });

  describe.runIf(TWITCH_CLIENT_ID !== undefined && TWITCH_SECRET !== undefined)(
    'getBttvApiUrlFromBroadcasterName',
    async () => {
      if (TWITCH_CLIENT_ID === undefined || TWITCH_SECRET === undefined) return;
      const twitchApi = await newTwitchApi(TWITCH_CLIENT_ID, TWITCH_SECRET);

      test('valid broadcasterName', async () => {
        const userId = (await twitchApi.users([broadcasterNameValid])).data[0].id;
        const bttvApiUrl = `https://api.betterttv.net/3/cached/users/twitch/${userId}`;

        const bttvApiUrlMessage = await getBttvApiUrlFromBroadcasterName(broadcasterNameValid, twitchApi);
        const { type } = bttvApiUrlMessage;

        expect(type).toBe('success');
        if (type !== 'success') return;
        expect(bttvApiUrlMessage.url).toBe(bttvApiUrl);
        expect(bttvApiUrlMessage.ownerUsername).toBeUndefined();
      });

      test('valid broadcasterName but never logged into BTTV', async () => {
        const broadcasterName = 'zackrawrr';
        (await twitchApi.users([broadcasterName])).data[0].id;

        const bttvApiUrlMessage = await getBttvApiUrlFromBroadcasterName(broadcasterName, twitchApi);

        expect(bttvApiUrlMessage.type).toBe('feedback');
      });

      test('invalid broadcasterName', async () => {
        const bttvApiUrlMessage = await getBttvApiUrlFromBroadcasterName(broadcasterNameInvalid, twitchApi);

        expect(bttvApiUrlMessage.type).toBe('error');
      });
    }
  );

  describe('getFfzTvApiUrlFromSevenTvEmoteSetLink', () => {
    test('valid broadcasterName', async () => {
      const ffzApiUrl = `https://api.frankerfacez.com/v1/room/${broadcasterNameValid.toLowerCase()}`;

      const ffzApiUrlMessage = await getFfzApiUrlFromBroadcasterName(broadcasterNameValid);
      const { type } = ffzApiUrlMessage;

      expect(type).toBe('success');
      if (type !== 'success') return;
      expect(ffzApiUrlMessage.url).toBe(ffzApiUrl);
      expect(ffzApiUrlMessage.ownerUsername).toBeUndefined();
    });

    test("valid broadcasterName but doesn't have emotes", async () => {
      const broadcasterName = 'zackrawrr';

      const ffzApiUrlMessage = await getFfzApiUrlFromBroadcasterName(broadcasterName);

      expect(ffzApiUrlMessage.type).toBe('feedback');
    });

    test('invalid broadcasterName', async () => {
      const ffzApiUrlMessage = await getFfzApiUrlFromBroadcasterName(broadcasterNameInvalid);

      expect(ffzApiUrlMessage.type).toBe('feedback');
    });
  });
});
