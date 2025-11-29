import { UserProfile } from '../types/user';

const TOKEN_KEY = 'verto/token';
const CURRENT_USER_KEY = 'verto/currentUser';
const LEGACY_TOKEN_KEY = 'crm/token';
const LEGACY_USER_KEY = 'crm/currentUser';

const canAccessStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export interface StoredSession {
  token: string;
  user: UserProfile;
}

export const getStoredSession = (): StoredSession | null => {
  if (!canAccessStorage()) {
    return null;
  }

  const storage = window.localStorage;
  const token = storage.getItem(TOKEN_KEY) ?? storage.getItem(LEGACY_TOKEN_KEY);
  if (!token) {
    return null;
  }

  const persistedUser = storage.getItem(CURRENT_USER_KEY);
  if (persistedUser) {
    try {
      const user = JSON.parse(persistedUser) as UserProfile;
      return { token, user };
    } catch (error) {
      console.warn('Unable to parse stored user profile, clearing it.', error);
      storage.removeItem(CURRENT_USER_KEY);
    }
  }

  const legacyEmail = storage.getItem(LEGACY_USER_KEY);

  if (legacyEmail) {
    return {
      token,
      user: {
        id: 'legacy-user',
        email: legacyEmail,
        firstName: null,
        lastName: null,
        displayName: legacyEmail,
        avatarUrl: null,
        jobTitle: null,
        location: null,
        bio: null,
        phoneNumber: null,
      },
    };
  }

  return null;
};

export const saveSession = (token: string, user: UserProfile) => {
  if (!canAccessStorage()) {
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
};

export const clearSession = () => {
  if (!canAccessStorage()) {
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
};
