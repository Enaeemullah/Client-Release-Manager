import { AuthProvider } from './contexts/AuthContext';
import { ReleasesProvider } from './contexts/ReleasesContext';
import { AppContent } from './components/AppContent';
import { TransactionsProvider } from './contexts/TransactionsContext';
import { ToastProvider } from './contexts/ToastContext';
import { OrganizationsProvider } from './contexts/OrganizationsContext';

const App = () => (
  <AuthProvider>
    <OrganizationsProvider>
      <ReleasesProvider>
        <TransactionsProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </TransactionsProvider>
      </ReleasesProvider>
    </OrganizationsProvider>
  </AuthProvider>
);

export default App;
