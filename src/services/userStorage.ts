const TOKEN_KEY = 'crm/token';
const CURRENT_USER_KEY = 'crm/currentUser';

export interface StoredSession {
  token: string;
  email: string;
}

export const getStoredSession = (): StoredSession | null => {
  const token = localStorage.getItem(TOKEN_KEY);
  const email = localStorage.getItem(CURRENT_USER_KEY);

  if (!token || !email) {
    return null;
  }

  return { token, email };
};

export const saveSession = (token: string, email: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(CURRENT_USER_KEY, email);
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
};
