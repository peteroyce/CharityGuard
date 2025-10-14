import { createTheme } from '@mui/material/styles';

export const appleTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#007AFF', // Apple Blue
      light: '#5AC8FA',
      dark: '#0051D5',
    },
    secondary: {
      main: '#34C759', // Apple Green
    },
    background: {
      default: '#F2F2F7',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1C1C1E',
      secondary: '#3A3A3C',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 25,
          textTransform: 'none',
          fontSize: '1rem',
          fontWeight: 600,
          padding: '12px 32px',
          boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px 0 rgba(0,118,255,0.39)',
          },
        },
      },
    },
  },
});