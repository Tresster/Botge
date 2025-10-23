/** @format */
import type { Index } from 'meilisearch';
import type { TwitchApi } from './api/twitch-api.ts';
import type { PersonalEmoteMatcherConstructor } from './emote-matcher-constructor.ts';
import type { PersonalEmoteSets } from './personal-emote-sets.ts';
import type { EmoteMatcher } from './emote-matcher.ts';
export declare class Guild {
  #private;
  constructor(
    id: string,
    broadcasterName: string | null,
    twitchClipsMeiliSearchIndex: Index | undefined,
    emoteMatcher: Readonly<EmoteMatcher>,
    emoteMatcherConstructor: Readonly<PersonalEmoteMatcherConstructor>,
    settingsPermittedRoleIds: readonly string[] | null,
    addEmotePermittedRoleIds: readonly string[] | null,
    allowEveryoneToAddEmote: boolean
  );
  get id(): string;
  get broadcasterName(): string | null;
  get emoteMatcher(): Readonly<EmoteMatcher>;
  get twitchClipsMeiliSearchIndex(): Index | undefined;
  get personalEmoteMatcherConstructor(): Readonly<PersonalEmoteMatcherConstructor>;
  get uniqueCreatorNames(): readonly string[] | undefined;
  get uniqueGameIds(): readonly string[] | undefined;
  get settingsPermittedRoleIds(): readonly string[] | null;
  get addEmotePermittedRoleIds(): readonly string[] | null;
  get allowEveryoneToAddEmote(): boolean;
  changeSettingsPermittedRoleIds(roleIds: readonly string[]): void;
  changeAddEmotePermittedRoleIds(roleIds: readonly string[]): void;
  toggleAllowEveryoneToAddEmote(): void;
  refreshEmoteMatcher(): Promise<void>;
  changeBroadcasterNameAndRefreshClips(
    twitchApi: Readonly<TwitchApi> | undefined,
    broadcasterName: string
  ): Promise<void>;
  changePersonalEmoteSetsAndRefreshEmoteMatcher(personalEmoteSets: PersonalEmoteSets): Promise<void>;
  refreshClips(twitchApi: Readonly<TwitchApi> | undefined, deleteOld?: boolean): Promise<void>;
  refreshUniqueCreatorNamesAndGameIds(): Promise<void>;
}
