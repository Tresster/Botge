/** @format */
import type { AddedEmote } from '../types.ts';
export declare class AddedEmotesDatabase {
  #private;
  constructor(filepath: string);
  insert(addedEmote: AddedEmote, guildId: string): void;
  delete(addedEmote: AddedEmote, guildId: string): void;
  getAll(guildId: string): readonly AddedEmote[];
  createTable(guildId: string): void;
  close(): void;
}
