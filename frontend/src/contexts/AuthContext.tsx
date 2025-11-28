import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearSession, getStoredSession, saveSession } from '../services/userStorage';
import {
  acceptInviteRequest,
  fetchInviteDetails,
  fetchCurrentUser,
  loginRequest,
  signupRequest,
  updatePasswordRequest,
  updateProfileRequest,
  type InviteDetails,
  type UpdatePasswordPayload,
  type UpdateProfilePayload,
} from '../services/api';
import { UserProfile } from '../types/user';

interface AuthContextValue {
  currentUser: UserProfile | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadInvite: (token: string) => Promise<InviteDetails>;
  acceptInvite: (token: string, password?: string) => Promise<boolean>;
  refreshProfile: () => Promise<UserProfile | null>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<UserProfile>;
  updatePassword: (payload: UpdatePasswordPayload) => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [initialSession] = useState(() => getStoredSession());
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(initialSession?.user ?? null);
  const [token, setToken] = useState<string | null>(initialSession?.token ?? null);

  const persistSession = useCallback((nextToken: string, user: UserProfile) => {
    setCurrentUser(user);
    setToken(nextToken);
    saveSession(nextToken, user);
  }, []);

  const signup = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await signupRequest(email, password);
        persistSession(response.token, response.user);
        return true;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    [persistSession]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await loginRequest(email, password);
        persistSession(response.token, response.user);
        return true;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    setToken(null);
    clearSession();
  }, []);

  const loadInvite = useCallback((inviteToken: string) => fetchInviteDetails(inviteToken), []);

  const acceptInvite = useCallback(
    async (inviteToken: string, password?: string) => {
      try {
        const response = await acceptInviteRequest(inviteToken, password);
        persistSession(response.token, response.user);
        return true;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    [persistSession]
  );

  const refreshProfile = useCallback(async () => {
    if (!token) {
      return null;
    }

    try {
      const profile = await fetchCurrentUser(token);
      persistSession(token, profile);
      return profile;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, [persistSession, token]);

  const updateProfile = useCallback(
    async (payload: UpdateProfilePayload) => {
      if (!token) {
        throw new Error('You must be signed in to update your settings.');
      }

      const updatedUser = await updateProfileRequest(token, payload);
      persistSession(token, updatedUser);
      return updatedUser;
    },
    [persistSession, token]
  );

  const updatePassword = useCallback(
    async (payload: UpdatePasswordPayload) => {
      if (!token) {
        throw new Error('You must be signed in to update your password.');
      }

      const updatedUser = await updatePasswordRequest(token, payload);
      persistSession(token, updatedUser);
      return updatedUser;
    },
    [persistSession, token]
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    refreshProfile().catch((error) => {
      if (error instanceof Error && error.message.toLowerCase().includes('unauthorized')) {
        logout();
      } else {
        console.warn('Unable to refresh user profile:', error);
      }
    });
  }, [token, refreshProfile, logout]);

  const value = useMemo(
    () => ({
      currentUser,
      token,
      login,
      signup,
      logout,
      loadInvite,
      acceptInvite,
      refreshProfile,
      updateProfile,
      updatePassword,
    }),
    [acceptInvite, currentUser, loadInvite, login, logout, refreshProfile, signup, token, updatePassword, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
