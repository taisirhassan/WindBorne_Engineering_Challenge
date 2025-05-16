import { useState, useEffect, createContext } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import './App.css';
import Map from './components/Map';
import Header from './components/Header';
import DataFetcher from './components/DataFetcher';
import ErrorBoundary from './components/ErrorBoundary';
import useThemePreference from './hooks/useThemePreference';
import getTheme from './theme';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Create a context for mode and toggleTheme
export const ModeContext = createContext({ mode: 'light', toggleTheme: () => {} });

// Error fallback component
const ErrorFallback = () => (
  <div className="error-fallback">
    <h2>Something went wrong!</h2>
    <p>The application encountered an unexpected error. Please refresh the page or try again later.</p>
  </div>
);

function App() {
  const [balloonData, setBalloonData] = useState([]);
  const [timeIndex, setTimeIndex] = useState(0); // 0 is current, 1 is 1 hour ago, etc.
  const [availableTimeIndices, setAvailableTimeIndices] = useState([]);
  const [invalidTimeIndices, setInvalidTimeIndices] = useState([]);
  const { mode, toggleTheme } = useThemePreference();
  const theme = getTheme(mode);
  
  // Handle time index changes and validate against available time indices
  useEffect(() => {
    if (availableTimeIndices.length > 0 && !availableTimeIndices.includes(timeIndex)) {
      // If current timeIndex is not available, select the closest available one
      const closestIndex = availableTimeIndices.reduce((prev, curr) => 
        Math.abs(curr - timeIndex) < Math.abs(prev - timeIndex) ? curr : prev
      );
      setTimeIndex(closestIndex);
    }
  }, [timeIndex, availableTimeIndices]);
  
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <ModeContext.Provider value={{ mode, toggleTheme }}>
            <CssBaseline />
            <div className="app">
              <Header 
                timeIndex={timeIndex} 
                setTimeIndex={setTimeIndex} 
                availableTimeIndices={availableTimeIndices}
                invalidTimeIndices={invalidTimeIndices}
              />
              <DataFetcher 
                timeIndex={timeIndex} 
                setBalloonData={setBalloonData} 
                setAvailableTimeIndices={setAvailableTimeIndices}
                setInvalidTimeIndices={setInvalidTimeIndices}
              />
              <main className="content">
                <Map balloonData={balloonData} />
              </main>
            </div>
          </ModeContext.Provider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
