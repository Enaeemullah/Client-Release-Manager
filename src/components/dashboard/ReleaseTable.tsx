import styles from './ReleaseTable.module.css';
import { ReleaseRow } from '../../types/releases';
import { DeleteIcon, EditIcon } from '../common/icons';

interface ReleaseTableProps {
  client: string;
  rows: ReleaseRow[];
  onEdit: (row: ReleaseRow) => void;
  onDelete: (row: ReleaseRow) => void;
}

export const ReleaseTable = ({ client, rows, onEdit, onDelete }: ReleaseTableProps) => (
  <div className={styles.card}>
    <div className={styles.cardHeader}>{client}</div>
    <table>
      <thead>
        <tr>
          <th>Environment</th>
          <th>Branch</th>
          <th>Version</th>
          <th>Build</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <span className={`${styles.badge} ${row.env === 'prod' ? styles['badge--prod'] : ''}`}>
                {row.env}
              </span>
            </td>
            <td className={styles.branch}>{row.branch}</td>
            <td>{row.version}</td>
            <td>#{row.build}</td>
            <td>{row.date}</td>
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
