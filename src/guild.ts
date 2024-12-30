import type { Index } from 'meilisearch';

import type { SevenTVEmoteNotInSet } from './types.js';
import type { EmoteMatcher } from './emote-matcher.js';
import type { PersonalEmoteMatcherConstructor } from './emote-matcher-constructor.js';
import type { TwitchApi } from './api/twitch-api.js';
import { listCutedogClipIds } from './utils/list-cutedog-clip-ids.js';
import { getClipsWithGameNameFromBroadcasterName, getClipsWithGameNameFromIds } from './utils/twitch-api-utils.js';

export const GUILD_ID_CUTEDOG = '251211223012474880';
export const GUILD_ID_ELLY = '369977562308411402';
export const BROADCASTER_NAME_CUTEDOG = 'Cutedog_';
export const BROADCASTER_NAME_ELLY = 'Elly';

export class Guild {
  public readonly id: string;
  readonly #broadcasterName: string | undefined;
  #emoteMatcher: Readonly<EmoteMatcher>;
  readonly #twitchClipsMeiliSearchIndex: Index | undefined;
  readonly #personalEmoteMatcherConstructor: Readonly<PersonalEmoteMatcherConstructor>;

  public constructor(
    id: string,
    broadcasterName: string | undefined,
    twitchClipsMeiliSearchIndex: Index | undefined,
    emoteMatcher: Readonly<EmoteMatcher>,
    emoteMatcherConstructor: Readonly<PersonalEmoteMatcherConstructor>
  ) {
    this.id = id;
    this.#broadcasterName = broadcasterName;
    this.#twitchClipsMeiliSearchIndex = twitchClipsMeiliSearchIndex;
    this.#emoteMatcher = emoteMatcher;
    this.#personalEmoteMatcherConstructor = emoteMatcherConstructor;
  }

  public get emoteMatcher(): Readonly<EmoteMatcher> {
    return this.#emoteMatcher;
  }
  public get twitchClipsMeiliSearchIndex(): Index | undefined {
    return this.#twitchClipsMeiliSearchIndex;
  }

  public refreshBTTVAndFFZPersonalEmotes(): void {
    void this.#personalEmoteMatcherConstructor.refreshBTTVAndFFZPersonalEmotes();
  }

  public async refreshEmoteMatcher(): Promise<void> {
    this.#emoteMatcher = (await this.#personalEmoteMatcherConstructor.constructEmoteMatcher()) ?? this.#emoteMatcher;
  }

  public addSevenTVEmoteNotInSet(emote: SevenTVEmoteNotInSet): void {
    this.#emoteMatcher.addSevenTVEmoteNotInSetSuffix(emote);
  }

  public async refreshClips(twitchApi: Readonly<TwitchApi> | undefined): Promise<void> {
    if (this.#twitchClipsMeiliSearchIndex === undefined || twitchApi === undefined) return;
    if (this.#broadcasterName === undefined) return;

    let updated = 0;

    if (this.id === GUILD_ID_CUTEDOG) {
      //custom clips
      const increment = 100;
      const clipIds = await listCutedogClipIds();
      if (clipIds === undefined) return;

      for (let i = 0; i < clipIds.length; i += increment) {
        const clips = await getClipsWithGameNameFromIds(twitchApi, clipIds.slice(i, i + increment));
        if (clips === undefined) continue;

        void this.#twitchClipsMeiliSearchIndex.updateDocuments(clips);
        updated += clips.length;
      }
    } else {
      //get top 1000 most viewed clips
      let getClipsWithGameNameFromBroadcasterName_ = await getClipsWithGameNameFromBroadcasterName(
        twitchApi,
        this.#broadcasterName
      );
      if (getClipsWithGameNameFromBroadcasterName_ === undefined) return;

      let [clips, cursor] = getClipsWithGameNameFromBroadcasterName_;
      void this.#twitchClipsMeiliSearchIndex.updateDocuments(clips);

      for (let i = 0; i < 9 && cursor !== undefined; i++) {
        getClipsWithGameNameFromBroadcasterName_ = await getClipsWithGameNameFromBroadcasterName(
          twitchApi,
          this.#broadcasterName,
          cursor
        );
        if (getClipsWithGameNameFromBroadcasterName_ === undefined) return;

        [clips, cursor] = getClipsWithGameNameFromBroadcasterName_;
        void this.#twitchClipsMeiliSearchIndex.updateDocuments(clips);
        updated += clips.length;
      }
    }

    console.log(`Updated ${updated} clips.`);
    return;
  }
}