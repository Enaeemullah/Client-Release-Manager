import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { createOrganizationRequest, fetchOrganizations, type CreateOrganizationPayload } from '../services/api';
import type { OrganizationSummary } from '../types/projects';

interface OrganizationsContextValue {
  organizations: OrganizationSummary[];
  isLoading: boolean;
  addOrganization: (input: CreateOrganizationPayload) => Promise<OrganizationSummary>;
  reload: () => Promise<void>;
}

const OrganizationsContext = createContext<OrganizationsContextValue | undefined>(undefined);

export const useOrganizations = () => {
  const context = useContext(OrganizationsContext);
  if (!context) {
    throw new Error('useOrganizations must be used within OrganizationsProvider');
  }
  return context;
};

interface OrganizationsProviderProps {
  children: ReactNode;
}

export const OrganizationsProvider = ({ children }: OrganizationsProviderProps) => {
  const { token } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const ensureToken = useCallback(() => {
    if (!token) {
      throw new Error('You must be signed in to manage organizations.');
    }
    return token;
  }, [token]);

  const loadOrganizations = useCallback(async () => {
    const authToken = ensureToken();
    return fetchOrganizations(authToken);
  }, [ensureToken]);

  useEffect(() => {
    let isMounted = true;

    if (!token) {
      setOrganizations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    loadOrganizations()
      .then((data) => {
        if (!isMounted) {
          return;
        }
        setOrganizations(sortOrganizations(data));
      })
      .catch((error) => {
        console.error(error);
        if (isMounted) {
          setOrganizations([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token, loadOrganizations]);

  const reload = useCallback(async () => {
    const data = await loadOrganizations();
    setOrganizations(sortOrganizations(data));
  }, [loadOrganizations]);

  const addOrganization = useCallback(
    async (input: CreateOrganizationPayload) => {
      const authToken = ensureToken();
      const payload: CreateOrganizationPayload = {
        name: input.name.trim(),
        code: input.code.trim(),
      };
      const created = await createOrganizationRequest(authToken, payload);
      setOrganizations((prev) => sortOrganizations([...prev.filter((org) => org.code !== created.code), created]));
      return created;
    },
    [ensureToken],
  );

  const value = useMemo(
    () => ({
      organizations,
      isLoading,
      addOrganization,
      reload,
    }),
    [organizations, isLoading, addOrganization, reload],
  );

  return <OrganizationsContext.Provider value={value}>{children}</OrganizationsContext.Provider>;
};

const sortOrganizations = (data: OrganizationSummary[]) =>
  [...data].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
