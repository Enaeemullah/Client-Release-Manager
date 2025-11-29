export interface ReleasePayload {
  branch: string;
  version: string;
  build: number;
  date: string;
  commitMessage: string | null;
}

export type ReleasesResponse = Record<string, Record<string, ReleasePayload>>;
