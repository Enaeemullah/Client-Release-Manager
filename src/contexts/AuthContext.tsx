import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { User } from '../types/releases';
import {
  clearCurrentUserId,
  getAllUsers,
  getCurrentUserId,
  saveUsers,
  setCurrentUserId,
} from '../services/userStorage';

interface AuthContextValue {
  currentUser: string | null;
  login: (email: string, password: string) => boolean;
  signup: (email: string, password: string) => boolean;
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
  const [currentUser, setCurrentUser] = useState<string | null>(() => getCurrentUserId());

  const signup = useCallback((email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const users = getAllUsers();

    if (users[normalizedEmail]) {
      return false;
    }

    const newUser: User = {
      email: normalizedEmail,
      password,
      releases: {},
    };

    saveUsers({ ...users, [normalizedEmail]: newUser });
    return true;
  }, []);

  const login = useCallback((email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const users = getAllUsers();
    const user = users[normalizedEmail];

    if (user && user.password === password) {
      setCurrentUser(normalizedEmail);
      setCurrentUserId(normalizedEmail);
      return true;
    }

    return false;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    clearCurrentUserId();
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      login,
      signup,
      logout,
    }),
    [currentUser, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
