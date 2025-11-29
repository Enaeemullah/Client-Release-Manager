import styles from './PendingInvitesPanel.module.css';
import { PendingProjectInvite } from '../../types/projects';

type InviteAction = 'accept' | 'reject';

interface PendingInvitesPanelProps {
  invites: PendingProjectInvite[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onAccept: (inviteId: string) => void;
  onReject: (inviteId: string) => void;
  actionState: { id: string; action: InviteAction } | null;
}

const formatExpiry = (expiresAt: string) => {
  const expires = new Date(expiresAt);
  if (Number.isNaN(expires.getTime())) {
    return 'soon';
  }

  return expires.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getInviterName = (invite: PendingProjectInvite) => {
  return (
    invite.invitedBy?.displayName ||
    [invite.invitedBy?.firstName, invite.invitedBy?.lastName].filter(Boolean).join(' ') ||
    invite.invitedBy?.email ||
    'a teammate'
  );
};

export const PendingInvitesPanel = ({
  invites,
  isLoading,
  error,
  onRefresh,
  onAccept,
  onReject,
  actionState,
}: PendingInvitesPanelProps) => {
  const showPanel = isLoading || invites.length > 0 || Boolean(error);
  if (!showPanel) {
    return null;
  }

  const handleRefresh = () => {
    onRefresh();
  };

  return (
    <section className={styles.panel} aria-live="polite">
      <div className={styles.header}>
        <div>
          <p className={styles.label}>Pending invitations</p>
          <p className={styles.subtitle}>Join projects teammates have shared with you.</p>
        </div>
        <button type="button" className={styles.refreshButton} onClick={handleRefresh} disabled={isLoading}>
          Refresh
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {isLoading && invites.length === 0 && !error && <p className={styles.loading}>Checking for invites…</p>}

      {invites.length > 0 && (
        <ul className={styles.list}>
          {invites.map((invite) => {
            const isProcessing = actionState?.id === invite.id;
            const processingAction = actionState?.action;

            return (
              <li key={invite.id} className={styles.invite}>
                <div className={styles.meta}>
                  <p className={styles.projectName}>{invite.project.name}</p>
                  <p className={styles.inviteDetails}>
                    Invited by {getInviterName(invite)} • Expires {formatExpiry(invite.expiresAt)}
                  </p>
                  <p className={styles.inviteDetails}>Client slug: {invite.project.slug}</p>
                </div>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.rejectButton}
                    onClick={() => onReject(invite.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing && processingAction === 'reject' ? 'Rejecting…' : 'Reject'}
                  </button>
                  <button
                    type="button"
                    className={styles.acceptButton}
                    onClick={() => onAccept(invite.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing && processingAction === 'accept' ? 'Joining…' : 'Accept invite'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
