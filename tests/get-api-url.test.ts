import { config } from 'dotenv';
import { describe, expect, test } from 'vitest';

import {
  getSevenTvApiUrlFromSevenTvEmoteSetLink,
  getBttvApiUrlFromBroadcasterName,
  getFfzApiUrlFromBroadcasterName
} from '../src/utils/interaction/get-api-url';

import { newTwitchApi } from '../src/utils/constructors/new-twitch-api';

config();
const { TWITCH_CLIENT_ID, TWITCH_SECRET } = process.env;

describe('Get API Url', () => {
  const broadcasterNameValid = 'CuteDog_';
  const broadcasterNameInvalid = 'invalidBroadcasterName';

  describe('getSevenTvApiUrlFromSevenTvEmoteSetLink', () => {
    test('valid broadcasterName & valid emote set URL', async () => {
      const emoteSetId = '01FDMJPSF8000CJ4MDR2FNZEQ3';
      const sevenTvEmoteSetLink = `https://7tv.app/emote-sets/${emoteSetId}`;
      const sevenTvApiUrl = `https://7tv.io/v3/emote-sets/${emoteSetId}`;

      const getSevenTvApiUrlFromSevenTvEmoteSetLink_ =
        await getSevenTvApiUrlFromSevenTvEmoteSetLink(sevenTvEmoteSetLink);
      expect(getSevenTvApiUrlFromSevenTvEmoteSetLink_.ownerUsername).toBe(broadcasterNameValid.toLowerCase());
      expect(getSevenTvApiUrlFromSevenTvEmoteSetLink_.error).toBeUndefined();
      expect(getSevenTvApiUrlFromSevenTvEmoteSetLink_.feedback).toBeUndefined();
      expect(getSevenTvApiUrlFromSevenTvEmoteSetLink_.url).toBe(sevenTvApiUrl);
    });

    test('invalid emote set URL', async () => {
      const emoteSetId = 'invaledEmoteSetUrl';
      const sevenTvEmoteSetLink = `https://7tv.app/emote-sets/${emoteSetId}`;

      const getSevenTvApiUrlFromSevenTvEmoteSetLink_ =
        await getSevenTvApiUrlFromSevenTvEmoteSetLink(sevenTvEmoteSetLink);
      expect(getSevenTvApiUrlFromSevenTvEmoteSetLink_.ownerUsername).toBeUndefined();
      expect(getSevenTvApiUrlFromSevenTvEmoteSetLink_.error).toBeDefined();
      expect(getSevenTvApiUrlFromSevenTvEmoteSetLink_.feedback).toBeUndefined();
      expect(getSevenTvApiUrlFromSevenTvEmoteSetLink_.url).toBeUndefined();
    });

    test('not URL', async () => {
      const sevenTvEmoteSetLink = 'notUrl';

      const getSevenTvApiUrlFromSevenTvEmoteSetLink_ =
        await getSevenTvApiUrlFromSevenTvEmoteSetLink(sevenTvEmoteSetLink);
      expect(getSevenTvApiUrlFromSevenTvEmoteSetLink_.ownerUsername).toBeUndefined();
      expect(getSevenTvApiUrlFromSevenTvEmoteSetLink_.error).toBeDefined();
      expect(getSevenTvApiUrlFromSevenTvEmoteSetLink_.feedback).toBeUndefined();
      expect(getSevenTvApiUrlFromSevenTvEmoteSetLink_.url).toBeUndefined();
    });

    test('not emote set URL', async () => {
      const sevenTvEmoteSetLink = 'https://www.google.com';

      const getSevenTvApiUrlFromSevenTvEmoteSetLink_ =
        await getSevenTvApiUrlFromSevenTvEmoteSetLink(sevenTvEmoteSetLink);
      expect(getSevenTvApiUrlFromSevenTvEmoteSetLink_.ownerUsername).toBeUndefined();
      expect(getSevenTvApiUrlFromSevenTvEmoteSetLink_.error).toBeDefined();
      expect(getSevenTvApiUrlFromSevenTvEmoteSetLink_.feedback).toBeUndefined();
      expect(getSevenTvApiUrlFromSevenTvEmoteSetLink_.url).toBeUndefined();
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

        const getBttvApiUrlFromBroadcasterName_ = await getBttvApiUrlFromBroadcasterName(
          broadcasterNameValid,
          twitchApi
        );
        expect(getBttvApiUrlFromBroadcasterName_.ownerUsername).toBeUndefined();
        expect(getBttvApiUrlFromBroadcasterName_.error).toBeUndefined();
        expect(getBttvApiUrlFromBroadcasterName_.feedback).toBeUndefined();
        expect(getBttvApiUrlFromBroadcasterName_.url).toBe(bttvApiUrl);
      });

      test('valid broadcasterName but never logged into BTTV', async () => {
        const broadcasterName = 'zackrawrr';
        (await twitchApi.users([broadcasterName])).data[0].id;

        const getBttvApiUrlFromBroadcasterName_ = await getBttvApiUrlFromBroadcasterName(broadcasterName, twitchApi);
        expect(getBttvApiUrlFromBroadcasterName_.ownerUsername).toBeUndefined();
        expect(getBttvApiUrlFromBroadcasterName_.error).toBeUndefined();
        expect(getBttvApiUrlFromBroadcasterName_.feedback).toBeDefined();
        expect(getBttvApiUrlFromBroadcasterName_.url).toBeUndefined();
      });

      test('invalid broadcasterName', async () => {
        const getBttvApiUrlFromBroadcasterName_ = await getBttvApiUrlFromBroadcasterName(
          broadcasterNameInvalid,
          twitchApi
        );
        expect(getBttvApiUrlFromBroadcasterName_.ownerUsername).toBeUndefined();
        expect(getBttvApiUrlFromBroadcasterName_.error).toBeDefined();
        expect(getBttvApiUrlFromBroadcasterName_.feedback).toBeUndefined();
        expect(getBttvApiUrlFromBroadcasterName_.url).toBeUndefined();
      });
    }
  );

  describe('getSevenTvApiUrlFromSevenTvEmoteSetLink', () => {
    test('valid broadcasterName', async () => {
      const ffzApiUrl = `https://api.frankerfacez.com/v1/room/${broadcasterNameValid.toLowerCase()}`;

      const getFfzApiUrlFromBroadcasterName_ = await getFfzApiUrlFromBroadcasterName(broadcasterNameValid);
      expect(getFfzApiUrlFromBroadcasterName_.ownerUsername).toBeUndefined();
      expect(getFfzApiUrlFromBroadcasterName_.error).toBeUndefined();
      expect(getFfzApiUrlFromBroadcasterName_.feedback).toBeUndefined();
      expect(getFfzApiUrlFromBroadcasterName_.url).toBe(ffzApiUrl);
    });

    test("valid broadcasterName but doesn't have emotes", async () => {
      const broadcasterName = 'zackrawrr';

      const getFfzApiUrlFromBroadcasterName_ = await getFfzApiUrlFromBroadcasterName(broadcasterName);
      expect(getFfzApiUrlFromBroadcasterName_.ownerUsername).toBeUndefined();
      expect(getFfzApiUrlFromBroadcasterName_.error).toBeUndefined();
      expect(getFfzApiUrlFromBroadcasterName_.feedback).toBeDefined();
      expect(getFfzApiUrlFromBroadcasterName_.url).toBeUndefined();
    });

    test('invalid broadcasterName', async () => {
      const getFfzApiUrlFromBroadcasterName_ = await getFfzApiUrlFromBroadcasterName(broadcasterNameInvalid);
      expect(getFfzApiUrlFromBroadcasterName_.ownerUsername).toBeUndefined();
      expect(getFfzApiUrlFromBroadcasterName_.error).toBeUndefined();
      expect(getFfzApiUrlFromBroadcasterName_.feedback).toBeDefined();
      expect(getFfzApiUrlFromBroadcasterName_.url).toBeUndefined();
    });
  });
});
