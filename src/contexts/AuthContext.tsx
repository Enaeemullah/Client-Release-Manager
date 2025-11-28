import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { clearSession, getStoredSession, saveSession } from '../services/userStorage';
import { loginRequest, signupRequest } from '../services/api';

interface AuthContextValue {
  currentUser: string | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
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
  const [session, setSession] = useState(() => getStoredSession());
  const [currentUser, setCurrentUser] = useState<string | null>(session?.email ?? null);
  const [token, setToken] = useState<string | null>(session?.token ?? null);

  const persistSession = useCallback((nextToken: string, email: string) => {
    setCurrentUser(email);
    setToken(nextToken);
    setSession({ email, token: nextToken });
    saveSession(nextToken, email);
  }, []);

  const signup = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await signupRequest(email, password);
        persistSession(response.token, response.user.email);
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
        persistSession(response.token, response.user.email);
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
    setSession(null);
    clearSession();
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      token,
      login,
      signup,
      logout,
    }),
    [currentUser, login, signup, logout, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
