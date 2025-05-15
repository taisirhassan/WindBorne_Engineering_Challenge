import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { 
  CircularProgress, 
  Alert, 
  Box, 
  Typography,
  Paper,
  useTheme
} from '@mui/material';

function DataFetcher({ timeIndex, setBalloonData, setAvailableTimeIndices, setInvalidTimeIndices, mode }) {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableIndices, setAvailableIndices] = useState([]);
  const [invalidIndices, setInvalidIndices] = useState([]);

  // Function to check if a file exists and is valid JSON
  const checkFileExists = useCallback(async (url, timeIndex) => {
    try {
      // First, check if file exists with HEAD request
      await axios.head(url);
      
      try {
        // Then try to actually fetch and parse the JSON to validate it
        const response = await axios.get(url);
        // If we get here, JSON is valid
        return { exists: true, valid: true };
      } catch (parseError) {
        console.warn(`Time period ${timeIndex} has invalid JSON format:`, parseError.message);
        // File exists but JSON is invalid
        return { exists: true, valid: false };
      }
    } catch (error) {
      // File doesn't exist
      return { exists: false, valid: false };
    }
  }, []);

  // Function to fetch available time indices
  useEffect(() => {
    const checkAvailableFiles = async () => {
      const validTimeIndices = [];
      const invalidTimeIndices = [];
      const promises = [];
      
      // Check files from 0 to 24 hours
      for (let i = 0; i <= 24; i++) {
        const formattedTimeIndex = i.toString().padStart(2, '0');
        const url = `/treasure/${formattedTimeIndex}.json`;
        
        promises.push(
          checkFileExists(url, i).then(result => {
            if (result.exists) {
              if (result.valid) {
                validTimeIndices.push(i);
              } else {
                invalidTimeIndices.push(i);
              }
            }
          })
        );
      }
      
      await Promise.all(promises);
      
      // Sort time indices in ascending order
      validTimeIndices.sort((a, b) => a - b);
      console.log("Available valid time indices:", validTimeIndices);
      console.log("Available but invalid time indices:", invalidTimeIndices);
      
      setAvailableIndices(validTimeIndices);
      setInvalidIndices(invalidTimeIndices);
      setAvailableTimeIndices(validTimeIndices); // Update parent component
    };
    
    checkAvailableFiles();
  }, [checkFileExists, setAvailableTimeIndices]);

  useEffect(() => {
    const fetchBalloonData = async () => {
      if (!availableIndices.includes(timeIndex) && availableIndices.length > 0) {
        // If current timeIndex is not available but we have other options,
        // don't attempt to fetch invalid data
        return;
      }

      if (invalidIndices.includes(timeIndex)) {
        setError(`The data file for ${timeIndex} hour${timeIndex === 1 ? '' : 's'} ago has invalid JSON format. Please select a different time period.`);
        setBalloonData([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        // Format timeIndex with leading zero if needed
        const formattedTimeIndex = timeIndex.toString().padStart(2, '0');
        // Use the proxied URL
        const url = `/treasure/${formattedTimeIndex}.json`;
        
        const response = await axios.get(url);
        
        // Process the data to ensure it's in the format we need
        // Each balloon entry should have [lat, lon, alt]
        const processedData = (response.data || []).filter(balloon => {
          // Ensure balloon is an array with exactly 3 elements
          return Array.isArray(balloon) && 
                 balloon.length === 3 && 
                 !balloon.some(isNaN) && // Ensure no NaN values
                 Math.abs(balloon[0]) <= 90 && // Valid latitude
                 Math.abs(balloon[1]) <= 180; // Valid longitude
        });
        
        console.log(`Fetched ${processedData.length} valid balloons from ${url}`);
        setBalloonData(processedData);
      } catch (err) {
        console.error("Error fetching balloon data:", err);
        let errorMessage = "Failed to fetch balloon data. Please try again later.";
        
        if (err.response) {
          errorMessage += ` (Status: ${err.response.status})`;
        } else if (err.request) {
          errorMessage += " (No response from server)";
        } else if (err.message && (err.message.includes('JSON') || err.message.includes('parse') || err.message.includes('unexpected'))) {
          // This is a JSON parsing error
          errorMessage = `Invalid JSON format in data file for ${timeIndex} hour${timeIndex === 1 ? '' : 's'} ago. Please select a different time period.`;
          
          // Add this to invalid indices if not already there
          if (!invalidIndices.includes(timeIndex)) {
            setInvalidIndices(prev => [...prev, timeIndex]);
          }
        }
        
        setError(errorMessage);
        setBalloonData([]); // Clear data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalloonData();
  }, [timeIndex, setBalloonData, availableIndices, invalidIndices]);

  if (error) {
    return (
      <Box sx={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease-in-out'
      }}>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Try selecting a different time period or refreshing the page.
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: mode === 'dark' ? 'rgba(18, 18, 18, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        borderRadius: 2,
        p: 3,
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease-in-out',
        boxShadow: theme.shadows[4]
      }}>
        <CircularProgress size={40} thickness={4} color="primary" />
        <Typography variant="body1" sx={{ mt: 2, color: 'text.primary' }}>
          Loading balloon data...
        </Typography>
      </Box>
    );
  }

  return null; // This component doesn't render anything when not loading
}

export default DataFetcher; 