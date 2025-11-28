import { useCallback, useMemo, useState } from 'react';
import styles from './Dashboard.module.css';
import { useReleases } from '../../contexts/ReleasesContext';
import { useAuth } from '../../contexts/AuthContext';
import { Release, ReleaseRow } from '../../types/releases';
import { filterReleases, flattenReleases, groupByClient, sortReleases } from '../../utils/releases';
import { Modal } from '../common/Modal';
import { ReleaseForm } from './ReleaseForm';
import { ReleaseTable } from './ReleaseTable';
import { SearchBar } from './SearchBar';
import { InviteUserForm } from './InviteUserForm';
import { DownloadIcon, LogoutIcon, PlusIcon, SettingsIcon } from '../common/icons';
import { UserSettingsModal } from './UserSettingsModal';

export const Dashboard = () => {
  const { releases, addRelease, updateRelease, deleteRelease, exportData, inviteUser } = useReleases();
  const { currentUser, logout } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ReleaseRow | null>(null);
  const [inviteTarget, setInviteTarget] = useState<string | null>(null);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const rows = useMemo(() => sortReleases(flattenReleases(releases)), [releases]);
  const filteredRows = useMemo(() => filterReleases(rows, searchTerm), [rows, searchTerm]);
  const groupedRows = useMemo(() => Array.from(groupByClient(filteredRows).entries()), [filteredRows]);

  const handleAdd = useCallback(
    async (client: string, env: string, release: Release) => {
      try {
        await addRelease(client, env, release);
        setCreateModalOpen(false);
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'Unable to add release.');
      }
    },
    [addRelease]
  );

  const handleEdit = useCallback(
    async (client: string, env: string, release: Release) => {
      try {
        await updateRelease(client, env, release);
        setEditTarget(null);
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'Unable to update release.');
      }
    },
    [updateRelease]
  );

  const handleDelete = useCallback(
    async (client: string, env: string) => {
      const shouldDelete = window.confirm(`Delete ${client}/${env}?`);
      if (!shouldDelete) {
        return;
      }

      try {
        await deleteRelease(client, env);
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'Unable to delete release.');
      }
    },
    [deleteRelease]
  );

  const handleInvite = useCallback(
    async (client: string, email: string) => {
      await inviteUser(client, email);
    },
    [inviteUser]
  );

  const activeEditData = editTarget
    ? {
        client: editTarget.client,
        env: editTarget.env,
        release: {
          branch: editTarget.branch,
          version: editTarget.version,
          build: editTarget.build,
          date: editTarget.date,
        } as Release,
      }
    : null;

  const displayName = currentUser?.displayName ?? currentUser?.email ?? 'Verto user';
  const avatarInitials = (displayName || 'V').slice(0, 2).toUpperCase();

  return (
    <section className={styles.container}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <p className={styles.badge}>Verto</p>
            <h1>Releases without the release anxiety.</h1>
            <p>Track every client environment, unblock product launches, and keep your go-to-market teams aligned.</p>
          </div>
          <div className={styles.userBlock}>
            <button className={styles.avatarButton} onClick={() => setSettingsOpen(true)} aria-label="Open settings">
              {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} alt="" /> : <span>{avatarInitials}</span>}
            </button>
            <div className={styles.userDetails}>
              <p className={styles.userName}>{displayName}</p>
              <p className={styles.userMeta}>{currentUser?.jobTitle || currentUser?.email}</p>
              <div className={styles.userActions}>
                <button className="btn btn--ghost" onClick={() => setSettingsOpen(true)}>
                  <SettingsIcon /> Settings
                </button>
                <button className="btn" onClick={logout}>
                  <LogoutIcon /> Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className={styles.toolbar}>
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search clients, branches, versions..." />
          <div className={styles.actions}>
            <button className="btn" onClick={() => exportData()}>
              <DownloadIcon /> Export
            </button>
            <button className="btn btn--filled" onClick={() => setCreateModalOpen(true)}>
              <PlusIcon /> Add Release
            </button>
          </div>
        </div>

        <div className={styles.cardGrid}>
          {groupedRows.map(([client, clientRows]) => (
            <ReleaseTable
              key={client}
              client={client}
              rows={clientRows}
              onEdit={(row) => setEditTarget(row)}
              onDelete={(row) => handleDelete(row.client, row.env)}
              onInvite={(targetClient) => setInviteTarget(targetClient)}
            />
          ))}
        </div>

        {filteredRows.length === 0 && (
          <div className={styles.emptyState}>No releases found. Add your first release to get started.</div>
        )}
      </div>

      <Modal title="Add new release" isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)}>
        <ReleaseForm onSubmit={handleAdd} onCancel={() => setCreateModalOpen(false)} />
      </Modal>

      <Modal title="Edit release" isOpen={Boolean(editTarget)} onClose={() => setEditTarget(null)}>
        {activeEditData && (
          <ReleaseForm initialData={activeEditData} onSubmit={handleEdit} onCancel={() => setEditTarget(null)} />
        )}
      </Modal>

      <Modal
        title={inviteTarget ? `Invite collaborators for ${inviteTarget}` : 'Invite collaborators'}
        isOpen={Boolean(inviteTarget)}
        onClose={() => setInviteTarget(null)}
      >
        {inviteTarget && (
          <InviteUserForm
            client={inviteTarget}
            onSubmit={(email) => handleInvite(inviteTarget, email)}
            onCancel={() => setInviteTarget(null)}
          />
        )}
      </Modal>

      <UserSettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
    </section>
  );
};
