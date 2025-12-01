import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { TransactionEventInput, TransactionEventsByClient } from '../types/transactions';
import { createTransactionEventRequest, fetchTransactionEvents, updateTransactionEventRequest } from '../services/api';

interface TransactionsContextValue {
  events: TransactionEventsByClient;
  addEvent: (client: string, petEventCode: string, petEventDesc: string) => Promise<void>;
  updateEvent: (eventId: string, values: TransactionEventInput) => Promise<void>;
  reload: () => Promise<void>;
}

const TransactionsContext = createContext<TransactionsContextValue | undefined>(undefined);

export const useTransactions = () => {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error('useTransactions must be used within TransactionsProvider');
  }
  return context;
};

interface TransactionsProviderProps {
  children: ReactNode;
}

export const TransactionsProvider = ({ children }: TransactionsProviderProps) => {
  const { token } = useAuth();
  const [events, setEvents] = useState<TransactionEventsByClient>({});

  const ensureToken = useCallback(() => {
    if (!token) {
      throw new Error('You must be signed in to manage transaction events.');
    }
    return token;
  }, [token]);

  const loadEvents = useCallback(async () => {
    const authToken = ensureToken();
    return fetchTransactionEvents(authToken);
  }, [ensureToken]);

  useEffect(() => {
    let isMounted = true;

    if (!token) {
      setEvents({});
      return;
    }

    loadEvents()
      .then((data) => {
        if (isMounted) {
          setEvents(data);
        }
      })
      .catch((error) => {
        console.error(error);
        if (isMounted) {
          setEvents({});
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token, loadEvents]);

  const reload = useCallback(async () => {
    const data = await loadEvents();
    setEvents(data);
  }, [loadEvents]);

  const addEvent = useCallback(
    async (client: string, petEventCode: string, petEventDesc: string) => {
      const authToken = ensureToken();
      const data = await createTransactionEventRequest(authToken, { client, petEventCode, petEventDesc });
      setEvents(data);
    },
    [ensureToken],
  );

  const updateEvent = useCallback(
    async (eventId: string, values: TransactionEventInput) => {
      const authToken = ensureToken();
      const data = await updateTransactionEventRequest(authToken, eventId, values);
      setEvents(data);
    },
    [ensureToken],
  );

  const value = useMemo(
    () => ({
      events,
      addEvent,
      updateEvent,
      reload,
    }),
    [events, addEvent, updateEvent, reload],
  );

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
};
