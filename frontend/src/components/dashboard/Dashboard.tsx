import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ProjectActivitySummary } from '../../types/projects';
import { ProjectActivityList } from './ProjectActivityList';

export const Dashboard = () => {
  const { releases, activity, addRelease, updateRelease, deleteRelease, exportData, inviteUser, getProjectActivity } =
    useReleases();
  const { currentUser, logout } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ReleaseRow | null>(null);
  const [inviteTarget, setInviteTarget] = useState<string | null>(null);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [activityModalClient, setActivityModalClient] = useState<string | null>(null);
  const [activityModalData, setActivityModalData] = useState<ProjectActivitySummary | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [isActivityLoading, setActivityLoading] = useState(false);

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

  const handleViewActivity = useCallback(
    async (client: string) => {
      setActivityModalClient(client);
      setActivityError(null);
      setActivityModalData(activity[client] ?? null);
      setActivityLoading(true);

      try {
        const details = await getProjectActivity(client);
        setActivityModalData(details);
      } catch (error) {
        console.error(error);
        setActivityModalData(null);
        setActivityError(error instanceof Error ? error.message : 'Unable to load project activity.');
      } finally {
        setActivityLoading(false);
      }
    },
    [activity, getProjectActivity],
  );

  const closeActivityModal = () => {
    setActivityModalClient(null);
    setActivityModalData(null);
    setActivityError(null);
    setActivityLoading(false);
  };

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

  const fullName = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ').trim();
  const primaryName = fullName || currentUser?.displayName || currentUser?.email || 'Verto user';
  const avatarInitials = (primaryName || 'V').slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const handleSettingsClick = () => {
    setSettingsOpen(true);
    closeMenu();
  };

  const handleLogoutClick = () => {
    logout();
    closeMenu();
  };

  return (
    <section className={styles.container}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <img src="/verto.svg" alt="Verto Logo" className={styles.logo} />
            <h1>Releases without the release anxiety.</h1>
            <p>Track every client environment, unblock product launches, and keep your go-to-market teams aligned.</p>
          </div>
          <div className={styles.userBlock} ref={menuRef}>
            <button
              type="button"
              className={styles.avatarButton}
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Open user menu"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
            >
              {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} alt="" /> : <span>{avatarInitials}</span>}
            </button>

            {isMenuOpen && (
              <div className={styles.userMenu} role="menu">
                <div className={styles.userMenuHeader}>
                  <p className={styles.userMenuName}>{primaryName}</p>
                  <p className={styles.userMenuEmail}>{currentUser?.email}</p>
                </div>

                <hr className={styles.userMenuDivider} />

                <div className={styles.userMenuActions}>
                  <button type="button" className={styles.userMenuButton} onClick={handleSettingsClick} role="menuitem">
                    <SettingsIcon /> Settings
                  </button>
                  <button type="button" className={styles.userMenuButton} onClick={handleLogoutClick} role="menuitem">
                    <LogoutIcon /> Logout
                  </button>
                </div>
              </div>
            )}
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
              activity={activity[client]}
              onViewActivity={handleViewActivity}
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

      <Modal
        title={activityModalClient ? `Activity for ${activityModalClient}` : 'Project activity'}
        isOpen={Boolean(activityModalClient)}
        onClose={closeActivityModal}
      >
        <div className={styles.activityModalContent}>
          {activityError && <p className={styles.activityError}>{activityError}</p>}
          {activityModalData && <ProjectActivityList summary={activityModalData} />}
          {isActivityLoading && <p className={styles.activityLoading}>Loading activity…</p>}
          {!isActivityLoading && !activityModalData && !activityError && (
            <p className={styles.activityLoading}>No activity has been recorded yet.</p>
          )}
        </div>
      </Modal>
    </section>
  );
};
