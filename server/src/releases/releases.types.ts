export interface ReleasePayload {
  branch: string;
  version: string;
  build: number;
  date: string;
}

export type ReleasesResponse = Record<string, Record<string, ReleasePayload>>;
