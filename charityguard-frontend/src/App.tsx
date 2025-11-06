import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Home from './pages/Home';
import Search from './pages/Search';
import Donate from './pages/Donate';
import TestFraud from './pages/TestFraud';
import FlaggedTransactions from './pages/FlaggedTransactions';
import UserDashboard from './pages/UserDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminFlaggedTransactions from './pages/AdminFlaggedTransactions';
import AdminUsers from './pages/AdminUsers';
import AdminActivityLogs from './pages/AdminActivityLogs';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminRoute from './components/AdminRoute';
import AdminNavbar from './components/AdminNavbar';
import CGLogo from './assets/CharityGuardLogo.png';
import './App.css';

// Create custom Material-UI theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#14b8a6',
      light: '#5eead4',
      dark: '#0f766e',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#06b6d4',
      light: '#67e8f9',
      dark: '#0e7490',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981',
      light: '#6ee7b7',
      dark: '#047857',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444',
      light: '#fca5a5',
      dark: '#dc2626',
      contrastText: '#ffffff',
    },
    background: {
      default: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      paper: 'rgba(15, 23, 42, 0.8)',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.8)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '0em',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '0em',
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      letterSpacing: '0em',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '1rem',
      borderRadius: '12px',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(20, 184, 166, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(20, 184, 166, 0.2)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 40px rgba(20, 184, 166, 0.2)',
          },
        },
      },
    },
  },
  shape: {
    borderRadius: 12,
  },
});

// Navigation Bar Component
const Navbar: React.FC = () => {
  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.95))',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(20, 184, 166, 0.2)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1400px',
          mx: 'auto',
          px: 4,
          py: 1.5,
        }}
      >
        {/* Logo */}
        <Box
          sx={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
          onClick={() => handleNavigation('/')}
        >
          <Box
            component="img"
            src={CGLogo}
            alt="CharityGuard"
            sx={{
              height: 60,
              width: 'auto',
              borderRadius: 2,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.08)'
              }
            }}
          />
        </Box>

        {/* Navigation Links */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              cursor: 'pointer',
              px: 3,
              py: 1.5,
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              '&:hover': {
                color: '#14b8a6',
                backgroundColor: 'rgba(20, 184, 166, 0.15)',
                transform: 'translateY(-2px)',
              },
            }}
            onClick={() => handleNavigation('/')}
          >
            Home
          </Box>
          <Box
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              cursor: 'pointer',
              px: 3,
              py: 1.5,
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              '&:hover': {
                color: '#14b8a6',
                backgroundColor: 'rgba(20, 184, 166, 0.15)',
                transform: 'translateY(-2px)',
              },
            }}
            onClick={() => handleNavigation('/search')}
          >
            Search
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box
          sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            position: 'relative',
          }}
        >
          <Routes>
            {/* User-Facing Routes (with regular navbar) */}
            <Route path="/" element={<><Navbar /><Home /></>} />
            <Route path="/search" element={<><Navbar /><Search /></>} />
            <Route path="/donate" element={<><Navbar /><Donate /></>} />
            <Route path="/donate/:id" element={<><Navbar /><Donate /></>} />
            <Route path="/flagged-transactions" element={<><Navbar /><FlaggedTransactions /></>} />
            <Route path="/dashboard" element={<><Navbar /><UserDashboard /></>} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/test-fraud" element={<TestFraud />} />
            {/* Admin Login (no navbar) */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin Routes (with AdminNavbar) */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminNavbar />
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <AdminRoute>
                  <AdminNavbar />
                  <AdminAnalytics />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/flagged-transactions"
              element={
                <AdminRoute>
                  <AdminNavbar />
                  <AdminFlaggedTransactions />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminNavbar />
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/activity"
              element={
                <AdminRoute>
                  <AdminNavbar />
                  <AdminActivityLogs />
                </AdminRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Toast Notifications */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
            style={{
              zIndex: 9999,
            }}
            toastStyle={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.95))',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(20, 184, 166, 0.3)',
              borderRadius: '12px',
              color: '#ffffff',
            }}
          />
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App;