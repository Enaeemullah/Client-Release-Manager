import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Release, ReleasesData } from '../types/releases';
import { useAuth } from './AuthContext';
import { getAllUsers, persistUserReleases } from '../services/userStorage';
import { downloadJson } from '../utils/download';

interface ReleasesContextValue {
  releases: ReleasesData;
  addRelease: (client: string, env: string, release: Release) => void;
  updateRelease: (client: string, env: string, release: Release) => void;
  deleteRelease: (client: string, env: string) => void;
  exportData: () => void;
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
  const { currentUser } = useAuth();
  const [releases, setReleases] = useState<ReleasesData>({});

  useEffect(() => {
    if (!currentUser) {
      setReleases({});
      return;
    }

    const users = getAllUsers();
    setReleases(users[currentUser]?.releases ?? {});
  }, [currentUser]);

  const persist = useCallback(
    (next: ReleasesData) => {
      if (!currentUser) {
        return;
      }

      setReleases(next);
      persistUserReleases(currentUser, next);
    },
    [currentUser]
  );

  const upsertRelease = useCallback(
    (client: string, env: string, release: Release) => {
      persist({
        ...releases,
        [client]: {
          ...(releases[client] ?? {}),
          [env]: release,
        },
      });
    },
    [persist, releases]
  );

  const addRelease = useCallback((client: string, env: string, release: Release) => {
    upsertRelease(client, env, release);
  }, [upsertRelease]);

  const updateRelease = useCallback((client: string, env: string, release: Release) => {
    upsertRelease(client, env, release);
  }, [upsertRelease]);

  const deleteRelease = useCallback(
    (client: string, env: string) => {
      if (!releases[client]) {
        return;
      }

      const nextClientReleases = { ...releases[client] };
      delete nextClientReleases[env];

      const nextState = { ...releases };
      if (Object.keys(nextClientReleases).length === 0) {
        delete nextState[client];
      } else {
        nextState[client] = nextClientReleases;
      }

      persist(nextState);
    },
    [persist, releases]
  );

  const exportData = useCallback(() => {
    if (!currentUser) {
      return;
    }

    downloadJson(releases, `releases-${currentUser}-${new Date().toISOString().split('T')[0]}.json`);
  }, [currentUser, releases]);

  const value = useMemo(
    () => ({
      releases,
      addRelease,
      updateRelease,
      deleteRelease,
      exportData,
    }),
    [addRelease, deleteRelease, exportData, releases, updateRelease]
  );

  return <ReleasesContext.Provider value={value}>{children}</ReleasesContext.Provider>;
};
