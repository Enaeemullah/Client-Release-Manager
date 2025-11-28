import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Release, ReleasesData } from '../types/releases';
import { useAuth } from './AuthContext';
import { downloadJson } from '../utils/download';
import {
  deleteRelease as deleteReleaseRequest,
  fetchReleases,
  sendProjectInvite,
  upsertRelease as upsertReleaseRequest,
} from '../services/api';

interface ReleasesContextValue {
  releases: ReleasesData;
  addRelease: (client: string, env: string, release: Release) => Promise<void>;
  updateRelease: (client: string, env: string, release: Release) => Promise<void>;
  deleteRelease: (client: string, env: string) => Promise<void>;
  exportData: () => void;
  inviteUser: (client: string, email: string) => Promise<void>;
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

  useEffect(() => {
    let isMounted = true;

    if (!token) {
      setReleases({});
      return;
    }

    const load = async () => {
      try {
        const data = await fetchReleases(token);
        if (isMounted) {
          setReleases(data);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setReleases({});
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

  const upsertRelease = useCallback(
    (client: string, env: string, release: Release) => {
      const authToken = ensureToken();
      return upsertReleaseRequest(authToken, client, env, release).then(setReleases);
    },
    [ensureToken]
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
    (client: string, env: string) => {
      const authToken = ensureToken();
      return deleteReleaseRequest(authToken, client, env).then(setReleases);
    },
    [ensureToken]
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
    downloadJson(releases, `releases-${identifier}-${new Date().toISOString().split('T')[0]}.json`);
  }, [currentUser, releases]);

  const value = useMemo(
    () => ({
      releases,
      addRelease,
      updateRelease,
      deleteRelease,
      exportData,
      inviteUser,
    }),
    [addRelease, deleteRelease, exportData, inviteUser, releases, updateRelease]
  );

  return <ReleasesContext.Provider value={value}>{children}</ReleasesContext.Provider>;
};
