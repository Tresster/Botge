/** @format */
export declare class CachedUrl {
  #private;
  constructor(base: string | undefined);
  get(remoteUrl: string): readonly [string, boolean];
}
