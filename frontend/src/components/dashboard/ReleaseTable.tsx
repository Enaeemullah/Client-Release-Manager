import styles from './ReleaseTable.module.css';
import { ReleaseRow } from '../../types/releases';
import { DeleteIcon, EditIcon, ShareIcon } from '../common/icons';
import { ProjectActivitySummary } from '../../types/projects';

interface ReleaseTableProps {
  client: string;
  rows: ReleaseRow[];
  onEdit: (row: ReleaseRow) => void;
  onDelete: (row: ReleaseRow) => void;
  onInvite: (client: string) => void;
  onViewActivity: (client: string) => void;
  activity?: ProjectActivitySummary;
}

const formatUserName = (user: ProjectActivitySummary['lastUpdatedBy']) => {
  if (!user) {
    return 'Someone';
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return user.displayName || name || user.email || 'Someone';
};

const formatTimestamp = (isoDate: string) =>
  new Date(isoDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const buildActivityText = (summary?: ProjectActivitySummary) => {
  if (!summary || !summary.lastUpdatedAt) {
    return 'No updates yet';
  }

  return `${formatUserName(summary.lastUpdatedBy)} • ${formatTimestamp(summary.lastUpdatedAt)}`;
};

export const ReleaseTable = ({ client, rows, onEdit, onDelete, onInvite, onViewActivity, activity }: ReleaseTableProps) => {
  const activitySummaryClassName = [styles.activitySummary, activity?.lastUpdatedAt ? styles.activitySummaryHighlight : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.headerContent}>
          <span className={styles.cardTitle}>{client}</span>
          <div className={activitySummaryClassName}>
            <span className={styles.activityLabel}>Last updated</span>
            <span className={styles.activityValue}>{buildActivityText(activity)}</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.shareButton} onClick={() => onInvite(client)} aria-label={`Invite collaborators for ${client}`}>
            <ShareIcon />
            Share
          </button>
          <button className={styles.activityButton} onClick={() => onViewActivity(client)} aria-label={`View activity for ${client}`}>
            Activity
          </button>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Environment</th>
            <th>Branch</th>
            <th>Version</th>
            <th>Build</th>
            <th>Date</th>
            <th>Commit message</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <span className={`${styles.badge} ${row.env === 'prod' ? styles['badge--prod'] : ''}`}>{row.env}</span>
              </td>
              <td className={styles.branch}>{row.branch}</td>
              <td>{row.version}</td>
              <td>#{row.build}</td>
              <td>{row.date}</td>
              <td className={styles.commitCell}>
                <p className={styles.commitMessage}>{row.commitMessage?.trim() ? row.commitMessage : '—'}</p>
              </td>
              <td>
                <div className={styles.actions}>
                  <button className={styles.iconButton} onClick={() => onEdit(row)} aria-label="Edit release">
                    <EditIcon />
                  </button>
                  <button className={styles.iconButton} onClick={() => onDelete(row)} aria-label="Delete release">
                    <DeleteIcon />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
