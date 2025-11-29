import styles from './ProjectActivityList.module.css';
import { ProjectActivityLogEntry, ProjectActivitySummary } from '../../types/projects';

interface ProjectActivityListProps {
  summary: ProjectActivitySummary;
}

type ReleaseChangeEntry = {
  field: string;
  previous: string | number | null;
  current: string | number | null;
};

const formatTimestamp = (isoDate: string) =>
  new Date(isoDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const truncate = (value: string, limit = 80) => (value.length > limit ? `${value.slice(0, limit - 1)}…` : value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const getMetadataString = (metadata: Record<string, unknown> | null | undefined, key: string) => {
  if (!isRecord(metadata)) {
    return null;
  }

  const value = metadata[key];
  return typeof value === 'string' ? value : null;
};

const getMetadataBoolean = (metadata: Record<string, unknown> | null | undefined, key: string) => {
  if (!isRecord(metadata)) {
    return false;
  }

  const value = metadata[key];
  return typeof value === 'boolean' ? value : false;
};

const toChangeValue = (value: unknown): string | number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    return value;
  }
  return null;
};

const getReleaseChanges = (metadata: Record<string, unknown> | null | undefined): ReleaseChangeEntry[] => {
  if (!isRecord(metadata)) {
    return [];
  }

  const rawChanges = metadata['changes'];
  if (!Array.isArray(rawChanges)) {
    return [];
  }

  return rawChanges
    .map((entry) => {
      if (!isRecord(entry)) {
        return null;
      }

      const fieldValue = entry['field'];
      if (typeof fieldValue !== 'string') {
        return null;
      }

      return {
        field: fieldValue,
        previous: toChangeValue(entry['previous']),
        current: toChangeValue(entry['current']),
      };
    })
    .filter((entry): entry is ReleaseChangeEntry => Boolean(entry));
};

const formatUserName = (user: ProjectActivityLogEntry['user']) => {
  if (!user) {
    return 'System';
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return user.displayName || name || user.email || 'Someone';
};

const describeAction = (log: ProjectActivityLogEntry) => {
  const environment = getMetadataString(log.metadata, 'environment');

  switch (log.action) {
    case 'project_created':
      return 'Project created';
    case 'release_upserted': {
      const isNewRelease = getMetadataBoolean(log.metadata, 'isNewRelease');
      const actionVerb = isNewRelease ? 'added' : 'updated';
      return environment ? `Release ${actionVerb} (${environment})` : `Release ${actionVerb}`;
    }
    case 'release_deleted':
      return environment ? `Release deleted (${environment})` : 'Release deleted';
    default:
      return log.action;
  }
};

const buildMetadataChips = (metadata: Record<string, unknown> | null | undefined) => {
  if (!isRecord(metadata)) {
    return [];
  }

  const fields: Array<{ key: string; label: string }> = [
    { key: 'environment', label: 'Env' },
    { key: 'branch', label: 'Branch' },
    { key: 'version', label: 'Version' },
    { key: 'build', label: 'Build' },
    { key: 'date', label: 'Date' },
    { key: 'commitMessage', label: 'Commit' },
  ];

  return fields
    .map(({ key, label }) => {
      const value = metadata[key];
      if (typeof value === 'string' || typeof value === 'number') {
        const normalizedValue =
          key === 'commitMessage' && typeof value === 'string' ? truncate(value, 90) : String(value);
        return { label, value: normalizedValue };
      }
      return null;
    })
    .filter((entry): entry is { label: string; value: string } => Boolean(entry));
};

const CHANGE_FIELD_LABELS: Record<string, string> = {
  environment: 'Environment',
  branch: 'Branch',
  version: 'Version',
  build: 'Build',
  date: 'Date',
  commitMessage: 'Commit',
};

const formatChangeValue = (value: string | number | null) => {
  if (value === null || value === undefined) {
    return '—';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  const trimmed = value.trim();
  return trimmed ? truncate(trimmed, 90) : '—';
};

export const ProjectActivityList = ({ summary }: ProjectActivityListProps) => (
  <div className={styles.container}>
    <div className={styles.headerRow}>
      <div>
        <p className={styles.projectName}>{summary.name}</p>
        <p className={styles.projectSlug}>{summary.slug}</p>
      </div>
      <div className={`${styles.statusBlock} ${summary.lastUpdatedAt ? styles.statusBlockHighlight : ''}`.trim()}>
        {summary.lastUpdatedAt ? (
          <>
            <span className={styles.statusLabel}>Last updated</span>
            <span className={styles.statusValue}>{formatTimestamp(summary.lastUpdatedAt)}</span>
          </>
        ) : (
          <span className={styles.statusValue}>No updates yet</span>
        )}
      </div>
    </div>

    {summary.recentLogs.length === 0 ? (
      <p className={styles.emptyState}>No activity recorded for this project.</p>
    ) : (
      <ol className={styles.timeline}>
        {summary.recentLogs.map((log) => {
          const chips = buildMetadataChips(log.metadata);
          const changes = getReleaseChanges(log.metadata);
          return (
            <li key={log.id} className={styles.timelineItem}>
              <div className={styles.timelineContent}>
                <p className={styles.action}>{describeAction(log)}</p>
                <p className={styles.meta}>
                  {formatUserName(log.user)} • {formatTimestamp(log.createdAt)}
                </p>
                {chips.length > 0 && (
                  <div className={styles.metadata}>
                    {chips.map((chip) => (
                      <span key={`${log.id}-${chip.label}-${chip.value}`} className={styles.metadataChip}>
                        {chip.label}: {chip.value}
                      </span>
                    ))}
                  </div>
                )}
                {changes.length > 0 && (
                  <div className={styles.changeBlock}>
                    <p className={styles.changeBlockTitle}>Changed fields</p>
                    <ul className={styles.changeList}>
                      {changes.map((change) => (
                        <li key={`${log.id}-${change.field}`} className={styles.changeItem}>
                          <span className={styles.changeField}>
                            {CHANGE_FIELD_LABELS[change.field] ?? change.field}
                          </span>
                          <span className={styles.changeValue}>{formatChangeValue(change.previous)}</span>
                          <span className={styles.changeArrow} aria-hidden="true">
                            →
                          </span>
                          <span className={`${styles.changeValue} ${styles.changeValueNew}`}>
                            {formatChangeValue(change.current)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    )}
  </div>
);
