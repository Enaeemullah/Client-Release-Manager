import { useAuth } from '../contexts/AuthContext';
import { AuthScreen } from './auth/AuthScreen';
import { Dashboard } from './dashboard/Dashboard';
import { AcceptInviteScreen } from './auth/AcceptInviteScreen';
import { useInviteToken } from '../hooks/useInviteToken';
import { Footer } from './common/Footer';

export const AppContent = () => {
  const { currentUser } = useAuth();
  const { inviteToken, clearInviteToken } = useInviteToken();

  let screen = <Dashboard />;

  if (inviteToken) {
    screen = <AcceptInviteScreen token={inviteToken} onComplete={clearInviteToken} />;
  } else if (!currentUser) {
    screen = <AuthScreen />;
  }

  return (
    <div className="app-shell">
      <main className="app-shell__main">{screen}</main>
      <Footer />
    </div>
  );
};
