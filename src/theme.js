import { createTheme } from '@mui/material/styles';

// Create theme configurations for both light and dark modes
export const getTheme = (mode) => {
  return createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            // Light mode colors
            primary: {
              main: '#1976d2',
              light: '#42a5f5',
              dark: '#1565c0',
            },
            secondary: {
              main: '#388e3c',
              light: '#4caf50',
              dark: '#2e7d32',
            },
            background: {
              default: '#f5f5f5',
              paper: '#ffffff',
              map: '#a4c9de', // Custom color for map background
            },
            text: {
              primary: '#212121',
              secondary: '#666666',
            },
          }
        : {
            // Dark mode colors
            primary: {
              main: '#90caf9',
              light: '#e3f2fd',
              dark: '#42a5f5',
            },
            secondary: {
              main: '#66bb6a',
              light: '#81c784',
              dark: '#388e3c',
            },
            background: {
              default: '#121212',
              paper: '#1e1e1e',
              map: '#263238', // Custom color for map in dark mode
            },
            text: {
              primary: '#ffffff',
              secondary: '#b0b0b0',
            },
          }),
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 500,
      },
      h6: {
        fontSize: '1.25rem',
        fontWeight: 500,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            margin: 0,
            padding: 0,
            transition: 'background-color 0.3s, color 0.3s',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.3s, box-shadow 0.3s',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
          },
        },
      },
    },
  });
};

export default getTheme; 