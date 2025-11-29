import styles from './ProjectActivityList.module.css';
import { ProjectActivityLogEntry, ProjectActivitySummary } from '../../types/projects';

interface ProjectActivityListProps {
  summary: ProjectActivitySummary;
}

const formatTimestamp = (isoDate: string) =>
  new Date(isoDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const truncate = (value: string, limit = 80) => (value.length > limit ? `${value.slice(0, limit - 1)}…` : value);

const formatUserName = (user: ProjectActivityLogEntry['user']) => {
  if (!user) {
    return 'System';
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return user.displayName || name || user.email || 'Someone';
};

const describeAction = (log: ProjectActivityLogEntry) => {
  const environment =
    log.metadata && typeof log.metadata['environment'] === 'string' ? (log.metadata['environment'] as string) : null;

  switch (log.action) {
    case 'project_created':
      return 'Project created';
    case 'release_upserted':
      return environment ? `Release updated (${environment})` : 'Release updated';
    case 'release_deleted':
      return environment ? `Release deleted (${environment})` : 'Release deleted';
    default:
      return log.action;
  }
};

const buildMetadataChips = (metadata: Record<string, unknown> | null | undefined) => {
  if (!metadata) {
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
              </div>
            </li>
          );
        })}
      </ol>
    )}
  </div>
);
