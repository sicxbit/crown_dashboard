
import { AuthProvider } from './contexts/AuthContext';
import { QueryProvider } from './contexts/QueryContext';
import { TeamProvider } from './contexts/TeamContext';
import AppRouter from './components/AppRouter';
import './index.css';
import { ThemeProvider } from './components/dashboard/Themecontext';

function App() {
  return (
    <ThemeProvider>
      <TeamProvider>
        <QueryProvider>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </QueryProvider>
      </TeamProvider>
    </ThemeProvider>

  );
}

export default App;