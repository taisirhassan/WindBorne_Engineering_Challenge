import { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { 
  CircularProgress, 
  Alert, 
  Box, 
  Typography,
  Paper,
  useTheme
} from '@mui/material';
import pLimit from 'p-limit-v3';
// p-limit is used to limit the number of concurrent HTTP requests

function DataFetcher({ timeIndex, setBalloonData, setAvailableTimeIndices, setInvalidTimeIndices, mode }) {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableIndices, setAvailableIndices] = useState([]);
  const [invalidIndices, setInvalidIndices] = useState([]);

  // Function to check if a file exists and is valid JSON
  const checkFileExists = useCallback(async (url, timeIndex) => {
    try {
      // Use HEAD request to only fetch headers
      const response = await axios.head(url, {
        validateStatus: () => true,
      });
      if (response.status === 404) {
        // File does not exist
        return { exists: false, valid: false };
      }
      // Check content-type header, but allow for .json extension as fallback
      const contentType = response.headers['content-type'] || '';
      const isLikelyJson = contentType.includes('application/json') || url.endsWith('.json');
      if (!isLikelyJson) {
        // Not a JSON file
        return { exists: true, valid: false };
      }
      
      // If it's likely JSON, fetch a small portion to verify it's actually valid JSON
      try {
        // Use GET with a small timeout and response size limit to minimize bandwidth usage
        const getResponse = await axios.get(url, {
          timeout: 5000, // 5 second timeout
          maxContentLength: 10240, // Limit to 10KB
          validateStatus: () => true,
        });
        
        if (getResponse.status !== 200) {
          return { exists: true, valid: false };
        }
        
        // Try to parse the response as JSON
        if (getResponse.data) {
          // If we can access the data property, axios has already parsed it as JSON
          // Additional validation: check if it's an array (expected format)
          return { 
            exists: true, 
            valid: Array.isArray(getResponse.data)
          };
        }
        
        return { exists: true, valid: true };
      } catch (parseError) {
        console.error("JSON parsing error:", parseError);
        // If there's a parsing error, the file exists but isn't valid JSON
        return { exists: true, valid: false };
      }
    } catch (error) {
      // Network or other error
      console.error("File check error:", error);
      return { exists: false, valid: false };
    }
  }, []);

  // Function to fetch available time indices
  useEffect(() => {
    const checkAvailableFiles = async () => {
      const validTimeIndices = [];
      const invalidTimeIndices = [];
      const limit = pLimit(4); // Limit concurrency to 4
      const promises = [];
      
      // Check files from 0 to 24 hours
      for (let i = 0; i <= 24; i++) {
        const formattedTimeIndex = i.toString().padStart(2, '0');
        const url = `${baseUrl}${formattedTimeIndex}.json`;
        
        promises.push(
          limit(() => checkFileExists(url, i)).then(result => {
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
      setAvailableTimeIndices(validTimeIndices);   // inform parent
      setInvalidTimeIndices(invalidTimeIndices);   // inform parent
    };
    
    checkAvailableFiles();
  }, [checkFileExists, setAvailableTimeIndices, setInvalidTimeIndices]);

  // Memoize the error message construction logic
  const constructErrorMessage = useCallback((err, timeIndex) => {
    let errorMessage = "Failed to fetch balloon data. Please try again later.";
    
    if (err.response) {
      errorMessage += ` (Status: ${err.response.status})`;
    } else if (err.request) {
      errorMessage += " (No response from server)";
    } else if (err.message && (err.message.includes('JSON') || err.message.includes('parse') || err.message.includes('unexpected'))) {
      // This is a JSON parsing error
      errorMessage = `Invalid JSON format in data file for ${timeIndex} hour${timeIndex === 1 ? '' : 's'} ago. Please select a different time period.`;
      
      // Add this to invalid indices if not already there
      setInvalidIndices(prev => prev.includes(timeIndex) ? prev : [...prev, timeIndex]);
      setInvalidTimeIndices(prev => prev.includes(timeIndex) ? prev : [...prev, timeIndex]); // keep parent in sync
    }
    
    return errorMessage;
  }, [setInvalidIndices, setInvalidTimeIndices]);

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
        const errorMessage = constructErrorMessage(err, timeIndex);
        setError(errorMessage);
        setBalloonData([]); // Clear data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalloonData();
  }, [timeIndex, setBalloonData, constructErrorMessage]);

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