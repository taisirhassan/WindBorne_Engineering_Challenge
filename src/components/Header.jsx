import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  FormControl, 
  Select, 
  MenuItem, 
  Box,
  Container,
  useTheme,
  Chip,
  Tooltip
} from '@mui/material';
import AirIcon from '@mui/icons-material/Air';
import InfoIcon from '@mui/icons-material/Info';
import ThemeToggle from './ThemeToggle';

function Header({ timeIndex, setTimeIndex, availableTimeIndices = [], invalidTimeIndices = [], mode, toggleTheme }) {
  const theme = useTheme();
  
  const handleTimeChange = (e) => {
    setTimeIndex(Number(e.target.value));
  };

  // Define all possible time options - based on what actually exists on the server
  const allTimeOptions = [
    { value: 0, label: 'Current' },
    { value: 1, label: '1 hour ago' },
    { value: 2, label: '2 hours ago' },
    { value: 3, label: '3 hours ago' },
    { value: 5, label: '5 hours ago' },
    { value: 7, label: '7 hours ago' },
    { value: 8, label: '8 hours ago' },
    { value: 9, label: '9 hours ago' },
    { value: 10, label: '10 hours ago' },
    { value: 11, label: '11 hours ago' },
    { value: 15, label: '15 hours ago' },
    { value: 17, label: '17 hours ago' },
    { value: 18, label: '18 hours ago' },
    { value: 19, label: '19 hours ago' }
  ];

  // Filter time options based on available data
  const timeOptions = availableTimeIndices.length > 0
    ? allTimeOptions.filter(option => availableTimeIndices.includes(option.value))
    : allTimeOptions;

  // Generate a summary of available time periods
  const getAvailableTimesSummary = () => {
    if (!availableTimeIndices.length) return "Checking available data...";
    
    const ranges = [];
    let start = null;
    let end = null;
    
    // Sort the indices to ensure sequential processing
    const sortedIndices = [...availableTimeIndices].sort((a, b) => a - b);
    
    for (let i = 0; i < sortedIndices.length; i++) {
      const current = sortedIndices[i];
      
      if (start === null) {
        // Initialize first range
        start = end = current;
      } else if (current === end + 1) {
        // Continue the current range
        end = current;
      } else {
        // End the current range and start a new one
        if (start === end) {
          ranges.push(`${start}h`);
        } else {
          ranges.push(`${start}-${end}h`);
        }
        start = end = current;
      }
    }
    
    // Add the last range
    if (start !== null) {
      if (start === end) {
        ranges.push(`${start}h`);
      } else {
        ranges.push(`${start}-${end}h`);
      }
    }
    
    return ranges.join(", ");
  };

  const availableTimesSummary = getAvailableTimesSummary();
  
  // Helper function to format a single time period range
  const formatTimePeriodRange = (range) => {
    // For single-hour ranges
    if (range.length === 1) {
      return `${range[0]}h`;
    }
    
    // For contiguous ranges
    return `${range[0]}-${range[range.length - 1]}h`;
  };
  
  // Format available time indices into a more readable format (e.g., "0-3h, 5h, 7-11h, 15h, 17-19h")
  const formatAvailableTimePeriods = () => {
    if (!availableTimeIndices.length) return "None";
    
    const sorted = [...availableTimeIndices].sort((a, b) => a - b);
    const ranges = [];
    let currentRange = [sorted[0]];
    
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === sorted[i-1] + 1) {
        // Continue the current range
        currentRange.push(sorted[i]);
      } else {
        // End current range and start a new one
        ranges.push(formatTimePeriodRange(currentRange));
        currentRange = [sorted[i]];
      }
    }
    
    // Add the last range
    if (currentRange.length > 0) {
      ranges.push(formatTimePeriodRange(currentRange));
    }
    
    return ranges.join(", ");
  };

  return (
    <AppBar position="static" color="primary">
      <Container maxWidth="lg">
        <Toolbar sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: { xs: 2, sm: 0 } 
          }}>
            <AirIcon sx={{ mr: 1, fontSize: '2rem' }} />
            <Typography variant="h6" component="div">
              WindBorne Air Quality Tracker
            </Typography>
            <Box sx={{ ml: 2 }}>
              <ThemeToggle mode={mode} toggleTheme={toggleTheme} />
            </Box>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2
          }}>
            {availableTimeIndices.length > 0 && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                mr: { xs: 0, md: 2 }
              }}>
                <Typography variant="caption" color="white" sx={{ mr: 1 }}>
                  Available data:
                </Typography>
                <Chip 
                  size="small" 
                  label={formatAvailableTimePeriods()}
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.2)', 
                    color: 'white',
                    fontSize: '0.7rem'
                  }}
                />
                <Tooltip title="These are the time periods with available data files">
                  <InfoIcon sx={{ ml: 0.5, fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }} />
                </Tooltip>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography 
                variant="caption" 
                color="white" 
                sx={{ mb: 0.5, fontWeight: 'medium' }}
              >
                Time Period
              </Typography>
              <FormControl variant="outlined" size="small" sx={{ 
                minWidth: 200, 
                bgcolor: 'background.paper', 
                borderRadius: 1
              }}>
                <Select
                  id="time-select"
                  value={timeIndex}
                  onChange={handleTimeChange}
                  displayEmpty
                  sx={{ 
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                      paddingTop: '10px',
                      paddingBottom: '10px',
                    },
                    '&.MuiOutlinedInput-root': { 
                      borderRadius: 1,
                      '& fieldset': { 
                        borderColor: theme.palette.grey[300]
                      }
                    }
                  }}
                  MenuProps={{
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    }
                  }}
                >
                  {timeOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Header; 