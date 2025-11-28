export interface Release {
  branch: string;
  version: string;
  build: number;
  date: string;
}

export type ClientReleases = Record<string, Release>;

export type ReleasesData = Record<string, ClientReleases>;

export interface ReleaseRow extends Release {
  id: string;
  client: string;
  env: string;
}

export interface User {
  email: string;
  password: string;
  releases: ReleasesData;
}
