/** @format */
import type { Guild } from './guild.ts';
export declare class User {
  #private;
  constructor(id: string, guild: Readonly<Guild>);
  get id(): string;
  get guild(): Readonly<Guild>;
  changeGuild(guild: Readonly<Guild>): void;
}
