import { AuthProvider } from './contexts/AuthContext';
import { ReleasesProvider } from './contexts/ReleasesContext';
import { AppContent } from './components/AppContent';

const App = () => (
  <AuthProvider>
    <ReleasesProvider>
      <AppContent />
    </ReleasesProvider>
  </AuthProvider>
);

export default App;
