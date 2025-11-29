import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Release, ReleasesData } from '../types/releases';
import { useAuth } from './AuthContext';
import { downloadExcel } from '../utils/download';
import {
  deleteRelease as deleteReleaseRequest,
  fetchReleases,
  fetchProjectActivityDetail,
  fetchProjectActivitySummaries,
  sendProjectInvite,
  upsertRelease as upsertReleaseRequest,
} from '../services/api';
import { ProjectActivityMap, ProjectActivitySummary } from '../types/projects';
import { flattenReleases } from '../utils/releases';

interface ReleasesContextValue {
  releases: ReleasesData;
  activity: ProjectActivityMap;
  addRelease: (client: string, env: string, release: Release) => Promise<void>;
  updateRelease: (client: string, env: string, release: Release) => Promise<void>;
  deleteRelease: (client: string, env: string) => Promise<void>;
  exportData: () => void;
  inviteUser: (client: string, email: string) => Promise<void>;
  refreshActivity: () => Promise<ProjectActivityMap>;
  getProjectActivity: (client: string) => Promise<ProjectActivitySummary>;
}

const ReleasesContext = createContext<ReleasesContextValue | undefined>(undefined);

export const useReleases = () => {
  const context = useContext(ReleasesContext);

  if (!context) {
    throw new Error('useReleases must be used within ReleasesProvider');
  }

  return context;
};

interface ReleasesProviderProps {
  children: ReactNode;
}

export const ReleasesProvider = ({ children }: ReleasesProviderProps) => {
  const { token, currentUser } = useAuth();
  const [releases, setReleases] = useState<ReleasesData>({});
  const [activity, setActivity] = useState<ProjectActivityMap>({});

  useEffect(() => {
    let isMounted = true;

    if (!token) {
      setReleases({});
      setActivity({});
      return;
    }

    const load = async () => {
      try {
        const [releaseData, activityData] = await Promise.all([fetchReleases(token), fetchProjectActivitySummaries(token)]);
        if (isMounted) {
          setReleases(releaseData);
          setActivity(activityData);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setReleases({});
          setActivity({});
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const ensureToken = useCallback(() => {
    if (!token) {
      throw new Error('You must be signed in to manage releases.');
    }

    return token;
  }, [token]);

  const refreshActivity = useCallback(async () => {
    const authToken = ensureToken();
    const activityData = await fetchProjectActivitySummaries(authToken);
    setActivity(activityData);
    return activityData;
  }, [ensureToken]);

  const getProjectActivity = useCallback(
    (client: string) => {
      const authToken = ensureToken();
      return fetchProjectActivityDetail(authToken, client);
    },
    [ensureToken],
  );

  const upsertRelease = useCallback(
    async (client: string, env: string, release: Release) => {
      const authToken = ensureToken();
      const data = await upsertReleaseRequest(authToken, client, env, release);
      setReleases(data);
      await refreshActivity();
    },
    [ensureToken, refreshActivity],
  );

  const addRelease = useCallback(
    (client: string, env: string, release: Release) => upsertRelease(client, env, release),
    [upsertRelease]
  );

  const updateRelease = useCallback(
    (client: string, env: string, release: Release) => upsertRelease(client, env, release),
    [upsertRelease]
  );

  const deleteRelease = useCallback(
    async (client: string, env: string) => {
      const authToken = ensureToken();
      const data = await deleteReleaseRequest(authToken, client, env);
      setReleases(data);
      await refreshActivity();
    },
    [ensureToken, refreshActivity],
  );

  const inviteUser = useCallback(
    (client: string, email: string) => {
      const authToken = ensureToken();
      return sendProjectInvite(authToken, client, email);
    },
    [ensureToken]
  );

  const exportData = useCallback(() => {
    if (!currentUser) {
      return;
    }

    const identifier = currentUser.email.split('@')[0] || 'verto-user';
    const rows = flattenReleases(releases).map((row) => ({
      Client: row.client,
      Environment: row.env,
      Branch: row.branch,
      Version: row.version,
      Build: row.build,
      Date: row.date,
      'Commit Message': row.commitMessage ?? '',
    }));

    const filename = `releases-${identifier}-${new Date().toISOString().split('T')[0]}.xlsx`;
    downloadExcel(
      [
        {
          name: 'Releases',
          rows,
          header: ['Client', 'Environment', 'Branch', 'Version', 'Build', 'Date', 'Commit Message'],
        },
      ],
      filename,
    );
  }, [currentUser, releases]);

  const value = useMemo(
    () => ({
      releases,
      activity,
      addRelease,
      updateRelease,
      deleteRelease,
      exportData,
      inviteUser,
      refreshActivity,
      getProjectActivity,
    }),
    [activity, addRelease, deleteRelease, exportData, getProjectActivity, inviteUser, refreshActivity, releases, updateRelease],
  );

  return <ReleasesContext.Provider value={value}>{children}</ReleasesContext.Provider>;
};
