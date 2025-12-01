export interface ActivityUser {
  id: string;
  email: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
}

export interface ProjectActivityLogEntry {
  id: string;
  action: 'project_created' | 'release_upserted' | 'release_deleted';
  createdAt: string;
  metadata: Record<string, unknown> | null;
  user: ActivityUser | null;
}

export interface ProjectActivitySummary {
  projectId: string;
  name: string;
  slug: string;
  lastUpdatedAt: string | null;
  lastUpdatedBy: ActivityUser | null;
  recentLogs: ProjectActivityLogEntry[];
}

export type ProjectActivityMap = Record<string, ProjectActivitySummary>;

export interface PendingProjectInvite {
  id: string;
  email: string;
  expiresAt: string;
  project: {
    id: string;
    name: string;
    slug: string;
  };
  invitedBy: ActivityUser | null;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  code: string;
}
