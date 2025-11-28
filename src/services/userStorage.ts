import { ReleasesData, User } from '../types/releases';

const USERS_KEY = 'crm/users';
const CURRENT_USER_KEY = 'crm/currentUser';

const readFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const getAllUsers = (): Record<string, User> => readFromStorage<Record<string, User>>(USERS_KEY, {});

export const saveUsers = (users: Record<string, User>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getCurrentUserId = () => localStorage.getItem(CURRENT_USER_KEY);

export const setCurrentUserId = (email: string) => {
  localStorage.setItem(CURRENT_USER_KEY, email);
};

export const clearCurrentUserId = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const persistUserReleases = (email: string, releases: ReleasesData) => {
  const users = getAllUsers();
  if (!users[email]) {
    return;
  }

  users[email] = {
    ...users[email],
    releases,
  };

  saveUsers(users);
};
