import '../styles/globals.css';
import '../styles/header.css';
import '../styles/poker-fonts.css';
import { CashProvider } from '../context/CashContext';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../components/ui/NotificationSystem';
import { ThemeProvider } from '../hooks/useTheme';

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CashProvider>
          <NotificationProvider>
            <Component {...pageProps} />
          </NotificationProvider>
        </CashProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

