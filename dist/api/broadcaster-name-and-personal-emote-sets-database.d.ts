/** @format */
import { PersonalEmoteSets } from '../personal-emote-sets.ts';
export declare class BroadcasterNameAndPersonalEmoteSetsDatabase {
  #private;
  constructor(filepath: string);
  changePersonalEmoteSets(guildId: string, personalEmoteSets: PersonalEmoteSets): void;
  changeBroadcasterName(guildId: string, broadcasterName: string): void;
  getPersonalEmoteSets(guildId: string): readonly [string | null, PersonalEmoteSets];
  getAllBroadcasterNamesAndPersonalEmoteSets(): Readonly<Map<string, readonly [string | null, PersonalEmoteSets]>>;
  close(): void;
}
