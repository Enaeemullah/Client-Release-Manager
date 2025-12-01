import { useMemo, useState } from 'react';
import styles from './TransactionEventsPanel.module.css';
import { TransactionEvent, TransactionEventsByClient } from '../../types/transactions';
import { CardViewIcon, ListViewIcon } from '../common/icons';

interface TransactionEventsPanelProps {
  eventsByClient: TransactionEventsByClient;
  onAddClick: () => void;
  onView: (event: TransactionEvent) => void;
  onEdit: (event: TransactionEvent) => void;
  onGenerateScript: () => void;
}

const formatTimestamp = (isoString: string) =>
  new Date(isoString).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export const TransactionEventsPanel = ({
  eventsByClient,
  onAddClick,
  onView,
  onEdit,
  onGenerateScript,
}: TransactionEventsPanelProps) => {
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const entries = useMemo(() => Object.entries(eventsByClient).sort(([a], [b]) => a.localeCompare(b)), [eventsByClient]);
  const flatEvents = useMemo(
    () =>
      entries.flatMap(([clientSlug, clientEvents]) =>
        clientEvents.map((event) => ({
          ...event,
          clientSlug,
        })),
      ),
    [entries],
  );

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Transaction events</p>
          <h2 className={styles.title}>Connect transaction codes to the right projects.</h2>
          <p className={styles.description}>
            Keep a single source of truth for transaction identifiers so your teams avoid duplicate work.
          </p>
        </div>
        <div className={styles.actions}>
          <div className={styles.viewToggle} role="group" aria-label="Toggle transaction event view">
            <button
              type="button"
              className={`${styles.viewToggleButton} ${viewMode === 'card' ? styles['viewToggleButton--active'] : ''}`.trim()}
              onClick={() => setViewMode('card')}
              aria-pressed={viewMode === 'card'}
            >
              <CardViewIcon /> Cards
            </button>
            <button
              type="button"
              className={`${styles.viewToggleButton} ${viewMode === 'list' ? styles['viewToggleButton--active'] : ''}`.trim()}
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
            >
              <ListViewIcon /> List
            </button>
          </div>
          <button type="button" className="btn" onClick={onGenerateScript}>
            Generate script
          </button>
          <button type="button" className="btn btn--filled" onClick={onAddClick}>
            Add transaction event
          </button>
        </div>
      </header>

      {entries.length === 0 && (
        <div className={styles.emptyState}>
          <p>No transaction events yet.</p>
          <p className={styles.emptyStateHint}>Add your first event to reserve a transaction code.</p>
        </div>
      )}

      {entries.length > 0 && viewMode === 'card' && (
        <div className={styles.grid}>
          {entries.map(([client, clientEvents]) => {
            const displayName = clientEvents[0]?.projectName || client;
            return (
              <article key={client} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.cardKicker}>Project</p>
                    <h3 className={styles.cardTitle}>{displayName?.toUpperCase()}</h3>
                    {displayName !== client && <p className={styles.cardSubtitle}>{client}</p>}
                  </div>
                  <span className={styles.cardCount}>{clientEvents.length} events</span>
                </div>
                <ul className={styles.eventList}>
                  {clientEvents.map((event) => (
                    <li key={event.id} className={styles.eventRow}>
                      <div className={styles.eventMain}>
                        <span className={styles.codeBadge}>{event.code}</span>
                        <p className={styles.eventDescription}>{event.description}</p>
                      </div>
                      <div className={styles.eventMetaRow}>
                        <p className={styles.eventMeta}>Created {formatTimestamp(event.createdAt)}</p>
                        <div className={styles.eventActions}>
                          <button type="button" onClick={() => onView(event)}>
                            View
                          </button>
                          <button type="button" onClick={() => onEdit(event)}>
                            Edit
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      )}

      {entries.length > 0 && viewMode === 'list' && (
        <div className={styles.listWrapper}>
          <table className={styles.listTable}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Description</th>
                <th>Project</th>
                <th>Last updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flatEvents.map((event) => (
                <tr key={event.id}>
                  <td>
                    <span className={styles.listCode}>{event.code}</span>
                  </td>
                  <td>{event.description}</td>
                  <td>
                    <div>
                      <div>{event.projectName}</div>
                      <div className={styles.listProject}>{event.clientSlug}</div>
                    </div>
                  </td>
                  <td>{formatTimestamp(event.updatedAt)}</td>
                  <td>
                    <div className={styles.listActions}>
                      <button type="button" onClick={() => onView(event)}>
                        View
                      </button>
                      <button type="button" onClick={() => onEdit(event)}>
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
