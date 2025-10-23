/** @format */
import type { Ping } from '../types.ts';
export declare class PingsDatabase {
  #private;
  constructor(filepath: string);
  insert(ping: Ping): void;
  delete(ping: Ping): void;
  updateUserIds(ping: Ping): void;
  updateUserIdRemoved(ping: Ping): void;
  getAll(): readonly Ping[];
  close(): void;
}
