import React, { useContext, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  FormControl, 
  Select, 
  MenuItem, 
  Box,
  Container,
  Chip,
  Tooltip
} from '@mui/material';
import AirIcon from '@mui/icons-material/Air';
import InfoIcon from '@mui/icons-material/Info';
import ThemeToggle from './ThemeToggle';
import PropTypes from 'prop-types';
import { ModeContext } from '../App';

// Move selectStyles definition above the component return
const selectStyles = {
  '& .MuiSelect-select': {
    display: 'flex',
    alignItems: 'center',
    paddingTop: '10px',
    paddingBottom: '10px',
  },
  '&.MuiOutlinedInput-root': { 
    borderRadius: 1,
    '& fieldset': { 
      borderColor: 'grey.300'
    }
  }
};

function Header({ timeIndex, setTimeIndex, availableTimeIndices = [] }) {
  const { mode, toggleTheme } = useContext(ModeContext);

  // Add useEffect to ensure timeIndex is always a valid option
  useEffect(() => {
    if (availableTimeIndices.length > 0 && !availableTimeIndices.includes(timeIndex)) {
      // If current timeIndex is not available, select the first available one
      setTimeIndex(availableTimeIndices[0]);
    }
  }, [availableTimeIndices, timeIndex, setTimeIndex]);

  const handleTimeChange = (e) => {
    setTimeIndex(Number(e.target.value));
  };

  // Define all possible time options - dynamically generate for 0 to 24 hours
  const allTimeOptions = Array.from({ length: 25 }, (_, i) => ({
    value: i,
    label: i === 0 ? 'Current' : `${i} hour${i === 1 ? '' : 's'} ago`
  }));

// Filter time options based on available data
  const timeOptions = availableTimeIndices.length > 0
    ? allTimeOptions.filter(option => availableTimeIndices.includes(option.value))
   : [...allTimeOptions];  // Use a copy to avoid mutations

 


  
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
                  <InfoIcon sx={{ ml: 0.5, fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }} aria-hidden="true" />
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
                  sx={selectStyles}
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

Header.propTypes = {
  timeIndex: PropTypes.number.isRequired,
  setTimeIndex: PropTypes.func.isRequired,
  availableTimeIndices: PropTypes.arrayOf(PropTypes.number),
};

export default Header; 