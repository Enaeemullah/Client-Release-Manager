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
import { PendingProjectInvite, ProjectActivitySummary } from '../../types/projects';
import { ProjectActivityList } from './ProjectActivityList';
import { PendingInvitesPanel } from './PendingInvitesPanel';
import { useTransactions } from '../../contexts/TransactionsContext';
import { TransactionEventsPanel } from './TransactionEventsPanel';
import { ProjectOption, TransactionEventForm, TransactionEventFormValues } from './TransactionEventForm';
import { TransactionEvent } from '../../types/transactions';
import { useToast } from '../../contexts/ToastContext';
import {
  acceptPendingInviteRequest,
  fetchPendingInvites,
  rejectPendingInviteRequest,
} from '../../services/api';
import { useOrganizations } from '../../contexts/OrganizationsContext';
import { AddOrganizationForm } from './AddOrganizationForm';
import { OrganizationList } from './OrganizationList';

export const Dashboard = () => {
  const {
    releases,
    activity,
    addRelease,
    updateRelease,
    deleteRelease,
    exportData,
    inviteUser,
    getProjectActivity,
    reloadWorkspace,
  } = useReleases();
  const { currentUser, logout, token } = useAuth();
  const { organizations, addOrganization, isLoading: isOrganizationsLoading } = useOrganizations();

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
  const [pendingInvites, setPendingInvites] = useState<PendingProjectInvite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [invitesError, setInvitesError] = useState<string | null>(null);
  const [inviteAction, setInviteAction] = useState<{ id: string; action: 'accept' | 'reject' } | null>(null);
  const [activeView, setActiveView] = useState<'releases' | 'organizations' | 'transactions'>('releases');
  const [isTransactionModalOpen, setTransactionModalOpen] = useState(false);
  const [viewTransactionEvent, setViewTransactionEvent] = useState<TransactionEvent | null>(null);
  const [editTransactionEvent, setEditTransactionEvent] = useState<TransactionEvent | null>(null);
  const [isOrganizationModalOpen, setOrganizationModalOpen] = useState(false);
  const toast = useToast();
  const loadPendingInvites = useCallback(async () => {
    if (!token) {
      setPendingInvites([]);
      setInvitesLoading(false);
      setInvitesError(null);
      return;
    }

    setInvitesLoading(true);
    setInvitesError(null);

    try {
      const invites = await fetchPendingInvites(token);
      setPendingInvites(invites);
    } catch (error) {
      console.error(error);
      setInvitesError(error instanceof Error ? error.message : 'Unable to load invitations.');
    } finally {
      setInvitesLoading(false);
    }
  }, [token]);

  const handleAcceptInvite = useCallback(
    async (inviteId: string) => {
      if (!token) {
        toast.error('Please sign in to accept invitations.');
        return;
      }

      setInviteAction({ id: inviteId, action: 'accept' });

      try {
        await acceptPendingInviteRequest(token, inviteId);
        await reloadWorkspace();
        await loadPendingInvites();
        toast.success('Invitation accepted.');
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : 'Unable to accept invite.');
      } finally {
        setInviteAction(null);
      }
    },
    [token, reloadWorkspace, loadPendingInvites, toast],
  );

  const handleRejectInvite = useCallback(
    async (inviteId: string) => {
      if (!token) {
        toast.error('Please sign in to reject invitations.');
        return;
      }

      setInviteAction({ id: inviteId, action: 'reject' });

      try {
        await rejectPendingInviteRequest(token, inviteId);
        await loadPendingInvites();
        toast.success('Invitation rejected.');
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : 'Unable to reject invite.');
      } finally {
        setInviteAction(null);
      }
    },
    [token, loadPendingInvites, toast],
  );


  const rows = useMemo(() => sortReleases(flattenReleases(releases)), [releases]);
  const filteredRows = useMemo(() => filterReleases(rows, searchTerm), [rows, searchTerm]);
  const groupedRows = useMemo(() => Array.from(groupByClient(filteredRows).entries()), [filteredRows]);
  const { events: transactionEvents, addEvent: addTransactionEvent, updateEvent: updateTransactionEvent } = useTransactions();
  const projectOptions = useMemo<ProjectOption[]>(() => {
    const labelMap = new Map<string, string>();

    organizations.forEach((org) => {
      labelMap.set(org.code, org.name);
    });

    Object.keys(activity).forEach((slug) => {
      if (!labelMap.has(slug)) {
        labelMap.set(slug, activity[slug]?.name ?? slug);
      }
    });

    Object.keys(releases).forEach((slug) => {
      if (!labelMap.has(slug)) {
        labelMap.set(slug, slug);
      }
    });

    Object.keys(transactionEvents).forEach((slug) => {
      if (!labelMap.has(slug)) {
        labelMap.set(slug, slug);
      }
    });

    return Array.from(labelMap.entries())
      .map(([slug, label]) => ({
        slug,
        label,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [organizations, releases, activity, transactionEvents]);

  const handleAdd = useCallback(
    async (client: string, env: string, release: Release) => {
      try {
        await addRelease(client, env, release);
        setCreateModalOpen(false);
        toast.success('Release saved.');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to add release.');
      }
    },
    [addRelease, toast],
  );

  const handleEdit = useCallback(
    async (client: string, env: string, release: Release) => {
      try {
        await updateRelease(client, env, release);
        setEditTarget(null);
        toast.success('Release updated.');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to update release.');
      }
    },
    [updateRelease, toast],
  );

  const handleDelete = useCallback(
    async (client: string, env: string) => {
      const shouldDelete = window.confirm(`Delete ${client}/${env}?`);
      if (!shouldDelete) {
        return;
      }

      try {
        await deleteRelease(client, env);
        toast.success('Release deleted.');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to delete release.');
      }
    },
    [deleteRelease, toast],
  );

  const handleInvite = useCallback(
    async (client: string, email: string) => {
      await inviteUser(client, email);
    },
    [inviteUser]
  );

  const handleAddOrganization = useCallback(
    async (values: { name: string; code: string }) => {
      try {
        await addOrganization(values);
        await reloadWorkspace();
        setOrganizationModalOpen(false);
        toast.success('Organization added.');
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : 'Unable to add organization.');
      }
    },
    [addOrganization, reloadWorkspace, toast],
  );

  const handleAddTransactionEvent = useCallback(
    async ({ client, code, description }: TransactionEventFormValues) => {
      try {
        await addTransactionEvent(client, code, description);
        setTransactionModalOpen(false);
        toast.success('Transaction event added.');
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : 'Unable to add transaction event.');
      }
    },
    [addTransactionEvent, toast],
  );

  const handleUpdateTransactionEvent = useCallback(
    async ({ client, code, description }: TransactionEventFormValues) => {
      if (!editTransactionEvent) {
        return;
      }

      try {
        await updateTransactionEvent(editTransactionEvent.id, { client, code, description });
        setEditTransactionEvent(null);
        toast.success('Transaction event updated.');
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : 'Unable to update transaction event.');
      }
    },
    [editTransactionEvent, updateTransactionEvent, toast],
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
          commitMessage: editTarget.commitMessage ?? '',
        } as Release,
      }
    : null;

  const fullName = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ').trim();
  const primaryName = fullName || currentUser?.displayName || currentUser?.email || 'Verto user';
  const avatarInitials = (primaryName || 'V').slice(0, 2).toUpperCase();

  useEffect(() => {
    loadPendingInvites();
  }, [loadPendingInvites]);

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

        <div className={styles.viewTabs} role="tablist" aria-label="Workspace views">
          <button
            type="button"
            className={`${styles.viewTabButton} ${activeView === 'releases' ? styles['viewTabButton--active'] : ''}`.trim()}
            onClick={() => setActiveView('releases')}
            role="tab"
            aria-selected={activeView === 'releases'}
          >
            Release management
          </button>
          <button
            type="button"
            className={`${styles.viewTabButton} ${activeView === 'organizations' ? styles['viewTabButton--active'] : ''}`.trim()}
            onClick={() => setActiveView('organizations')}
            role="tab"
            aria-selected={activeView === 'organizations'}
          >
            Organizations
          </button>
          <button
            type="button"
            className={`${styles.viewTabButton} ${activeView === 'transactions' ? styles['viewTabButton--active'] : ''}`.trim()}
            onClick={() => setActiveView('transactions')}
            role="tab"
            aria-selected={activeView === 'transactions'}
          >
            Transaction events
          </button>
        </div>

        {activeView === 'releases' && (
          <>
            <div className={styles.toolbar}>
              <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search clients, branches, versions..." />
              <div className={styles.actions}>
                <button className="btn" onClick={() => exportData()}>
                  <DownloadIcon /> Export
                </button>
                <button className="btn" onClick={() => setOrganizationModalOpen(true)}>
                  <PlusIcon /> Add organization
                </button>
                <button className="btn btn--filled" onClick={() => setCreateModalOpen(true)}>
                  <PlusIcon /> Add Release
                </button>
              </div>
            </div>

            <PendingInvitesPanel
              invites={pendingInvites}
              isLoading={invitesLoading}
              error={invitesError}
              onRefresh={() => {
                void loadPendingInvites();
              }}
              onAccept={handleAcceptInvite}
              onReject={handleRejectInvite}
              actionState={inviteAction}
            />

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
          </>
        )}

        {activeView === 'organizations' && (
          <OrganizationList
            organizations={organizations}
            isLoading={isOrganizationsLoading}
            onAddClick={() => setOrganizationModalOpen(true)}
          />
        )}

        {activeView === 'transactions' && (
          <TransactionEventsPanel
            eventsByClient={transactionEvents}
            onAddClick={() => setTransactionModalOpen(true)}
            onView={setViewTransactionEvent}
            onEdit={setEditTransactionEvent}
          />
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

      <Modal title="Add organization" isOpen={isOrganizationModalOpen} onClose={() => setOrganizationModalOpen(false)}>
        <AddOrganizationForm onSubmit={handleAddOrganization} onCancel={() => setOrganizationModalOpen(false)} />
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

      <Modal title="Add transaction event" isOpen={isTransactionModalOpen} onClose={() => setTransactionModalOpen(false)}>
        <TransactionEventForm
          projects={projectOptions}
          onSubmit={handleAddTransactionEvent}
          onCancel={() => setTransactionModalOpen(false)}
        />
      </Modal>

      <Modal
        title={viewTransactionEvent ? `Transaction ${viewTransactionEvent.code}` : 'Transaction event'}
        isOpen={Boolean(viewTransactionEvent)}
        onClose={() => setViewTransactionEvent(null)}
      >
        {viewTransactionEvent && (
          <div className={styles.transactionDetails}>
            <p>
              <strong>Project:</strong> {viewTransactionEvent.projectName} ({viewTransactionEvent.client})
            </p>
            <p>
              <strong>Code:</strong> {viewTransactionEvent.code}
            </p>
            <p>
              <strong>Description:</strong> {viewTransactionEvent.description}
            </p>
            <p>
              <strong>Created:</strong> {new Date(viewTransactionEvent.createdAt).toLocaleString()}
            </p>
            <p>
              <strong>Last updated:</strong> {new Date(viewTransactionEvent.updatedAt).toLocaleString()}
            </p>
          </div>
        )}
      </Modal>

      <Modal title="Edit transaction event" isOpen={Boolean(editTransactionEvent)} onClose={() => setEditTransactionEvent(null)}>
        {editTransactionEvent && (
          <TransactionEventForm
            projects={projectOptions}
            initialValues={{
              client: editTransactionEvent.client,
              code: editTransactionEvent.code,
              description: editTransactionEvent.description,
            }}
            submitLabel="Save changes"
            onSubmit={handleUpdateTransactionEvent}
            onCancel={() => setEditTransactionEvent(null)}
          />
        )}
      </Modal>

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
