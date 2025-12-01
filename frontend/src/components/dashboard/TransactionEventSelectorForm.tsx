import { useEffect, useMemo, useState } from 'react';
import styles from './TransactionEventSelectorForm.module.css';
import { TransactionEventsByClient } from '../../types/transactions';

interface TransactionEventSelectorFormProps {
  eventsByClient: TransactionEventsByClient;
}

const formatTimestamp = (isoString: string) => new Date(isoString).toLocaleString();

export const TransactionEventSelectorForm = ({ eventsByClient }: TransactionEventSelectorFormProps) => {
  const events = useMemo(() => {
    const flattened = Object.values(eventsByClient).flat();
    return flattened.sort((a, b) => a.code.localeCompare(b.code));
  }, [eventsByClient]);

  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    if (!events.find((event) => event.id === selectedId)) {
      setSelectedId('');
    }
  }, [events, selectedId]);

  const selectedEvent = events.find((event) => event.id === selectedId);
  const hasEvents = events.length > 0;

  return (
    <section className={styles.container} aria-label="Transaction type quick lookup">
      <div className={styles.header}>
        <p className={styles.kicker}>Transaction type</p>
        <h3 className={styles.title}>Quickly inspect an existing event.</h3>
        <p className={styles.description}>
          Use the dropdown to reference a transaction event without leaving the workspace.
        </p>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="transaction-event-picker">
          Transaction event
        </label>
        <select
          id="transaction-event-picker"
          className={styles.select}
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          disabled={!hasEvents}
        >
          <option value="">{hasEvents ? 'Select a transaction event' : 'No events available'}</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.code} · {event.projectName || event.client}
            </option>
          ))}
        </select>
      </div>

      {selectedEvent ? (
        <div className={styles.preview}>
          <p>
            <strong>Project:</strong> {selectedEvent.projectName || selectedEvent.client}
          </p>
          <p>
            <strong>Client slug:</strong> {selectedEvent.client}
          </p>
          <p>
            <strong>Description:</strong> {selectedEvent.description}
          </p>
          <p>
            <strong>Last updated:</strong> {formatTimestamp(selectedEvent.updatedAt)}
          </p>
        </div>
      ) : (
        <p className={styles.empty}>
          {hasEvents ? 'Select an event above to preview its metadata.' : 'Add a transaction event to populate this quick lookup.'}
        </p>
      )}
    </section>
  );
};
