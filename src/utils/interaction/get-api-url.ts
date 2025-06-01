import type { TwitchApi } from '../../api/twitch-api.ts';
import type { BTTVPersonalEmotes, FFZPersonalEmotes, SevenTVEmotes } from '../../types.ts';
import { fetchAndJson } from '../fetch-and-json.ts';

const regExpSevenTvEmoteSetLink: Readonly<RegExp> = new RegExp(/^https:\/\/7tv\.app\/emote-sets\/[A-Za-z0-9]{26}$/);

export type ApiUrlMessage = {
  readonly error: string | undefined;
  readonly url: string | undefined;
  readonly ownerUsername: string | undefined;
  readonly feedback: string | undefined;
};

export function getSevenTvEmoteSetLinkFromSevenTvApiUlr(sevenTvEmoteSetApiUrl: string): string {
  const emoteSetId = sevenTvEmoteSetApiUrl.split('/').at(-1);
  return `https://7tv.app/emote-sets/${emoteSetId}`;
}

export async function getSevenTvApiUrlFromSevenTvEmoteSetLink(sevenTvEmoteSetLink: string): Promise<ApiUrlMessage> {
  const test = regExpSevenTvEmoteSetLink.test(sevenTvEmoteSetLink);
  if (!test)
    return {
      error:
        'Invalid 7TV Emote set link. The link should start with https://7tv.app/emote-sets/ and end with 26 characters'
    } as ApiUrlMessage;

  const emoteSetId = sevenTvEmoteSetLink.split('/').at(-1);
  const sevenTvApiUrl = `https://7tv.io/v3/emote-sets/${emoteSetId}`;

  const fetched = await fetchAndJson(sevenTvApiUrl).catch(() => undefined);
  if (fetched === undefined) return { error: 'Unknown error at getting 7TV emote set.' } as ApiUrlMessage;

  const sevenTVEmotes = fetched as SevenTVEmotes;
  if (sevenTVEmotes.error !== undefined) return { error: sevenTVEmotes.error } as ApiUrlMessage;
  return {
    url: sevenTvApiUrl,
    ownerUsername: sevenTVEmotes.owner.username
  } as ApiUrlMessage;
}

export async function getBttvApiUrlFromBroadcasterName(
  broadcasterName: string,
  twitchApi: Readonly<TwitchApi> | undefined
): Promise<ApiUrlMessage> {
  if (twitchApi === undefined)
    return { error: 'The bot is unable to get broadcastername from Twitch at this time.' } as ApiUrlMessage;

  const users = await twitchApi.users([broadcasterName]).catch(() => undefined);
  if (users === undefined) return { error: 'Unknown error at getting broadcaster id from Twitch.' } as ApiUrlMessage;

  if (users.data.length === 0) return { error: 'No such broadcaster' } as ApiUrlMessage;

  const userId = users.data[0].id;
  const apiUrl = `https://api.betterttv.net/3/cached/users/twitch/${userId}`;

  const fetched = await fetchAndJson(apiUrl).catch(() => undefined);
  if (fetched === undefined) return { error: 'Unknown error at getting BTTV emote set.' } as ApiUrlMessage;

  const bttvPersonalEmotes = fetched as BTTVPersonalEmotes;
  if (bttvPersonalEmotes.message !== undefined)
    return { feedback: 'Broadcaster does not have BTTV emotes' } as ApiUrlMessage;
  return { url: apiUrl } as ApiUrlMessage;
}

export async function getFfzApiUrlFromBroadcasterName(broadcasterName: string): Promise<ApiUrlMessage> {
  const apiUrl = `https://api.frankerfacez.com/v1/room/${broadcasterName.toLowerCase()}`;

  const fetched = await fetchAndJson(apiUrl).catch(() => undefined);
  if (fetched === undefined) return { error: 'Unknown error at getting FFZ emote set.' } as ApiUrlMessage;

  const ffzPersonalEmotes = fetched as FFZPersonalEmotes;
  if (ffzPersonalEmotes.error !== undefined)
    return { feedback: 'Broadcaster does not have ffz emotes.' } as ApiUrlMessage;
  return { url: apiUrl } as ApiUrlMessage;
}
