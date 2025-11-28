import { useAuth } from '../contexts/AuthContext';
import { AuthScreen } from './auth/AuthScreen';
import { Dashboard } from './dashboard/Dashboard';

export const AppContent = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <AuthScreen />;
  }

  return <Dashboard />;
};
