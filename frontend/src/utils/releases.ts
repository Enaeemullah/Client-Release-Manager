import { Release, ReleaseRow, ReleasesData } from '../types/releases';

export const normalizeKey = (value: string) => value.trim().toLowerCase();

export const flattenReleases = (releases: ReleasesData): ReleaseRow[] =>
  Object.entries(releases).flatMap(([client, environments]) =>
    Object.entries(environments).map(([env, release]) => ({
      id: `${client}-${env}`,
      client,
      env,
      ...release,
    }))
  );

export const filterReleases = (rows: ReleaseRow[], rawTerm: string) => {
  const term = rawTerm.trim().toLowerCase();
  if (!term) {
    return rows;
  }

  return rows.filter((row) =>
    row.client.toLowerCase().includes(term) ||
    row.env.toLowerCase().includes(term) ||
    row.branch.toLowerCase().includes(term) ||
    row.version.toLowerCase().includes(term)
  );
};

export const groupByClient = (rows: ReleaseRow[]) => {
  const grouped = new Map<string, ReleaseRow[]>();

  rows.forEach((row) => {
    if (!grouped.has(row.client)) {
      grouped.set(row.client, []);
    }

    grouped.get(row.client)!.push(row);
  });

  return grouped;
};

export const sortReleases = (rows: ReleaseRow[]) =>
  [...rows].sort((a, b) => a.client.localeCompare(b.client));

export const buildReleasePayload = (release: Release) => ({ ...release });
