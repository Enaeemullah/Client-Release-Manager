import styles from './OrganizationList.module.css';
import type { OrganizationSummary } from '../../types/projects';

interface OrganizationListProps {
  organizations: OrganizationSummary[];
  isLoading: boolean;
  onAddClick: () => void;
}

export const OrganizationList = ({ organizations, isLoading, onAddClick }: OrganizationListProps) => {
  const hasOrganizations = organizations.length > 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h2>Organizations</h2>
          <p className={styles.subtitle}>Manage the clients that power release and transaction workflows.</p>
        </div>
        <button type="button" className="btn btn--filled" onClick={onAddClick}>
          Add organization
        </button>
      </div>

      {isLoading && <p className={styles.message}>Loading organizations…</p>}

      {!isLoading && hasOrganizations && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr key={org.id}>
                  <td>
                    <span className={styles.name}>{org.name}</span>
                  </td>
                  <td>
                    <code className={styles.code}>{org.code}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !hasOrganizations && <p className={styles.message}>No organizations yet. Add one to get started.</p>}
    </div>
  );
};
