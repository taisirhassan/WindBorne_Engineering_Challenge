import React, { useState, useEffect, useLayoutEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { 
  Paper, 
  Typography, 
  Box, 
  Divider, 
  Chip,
  CircularProgress
} from '@mui/material';

// Function to determine marker color based on altitude
const getAltitudeColor = (altitude) => {
  if (altitude < 5) return "#3388ff"; // Low altitude - blue
  if (altitude < 10) return "#33ff88"; // Medium altitude - green
  if (altitude < 15) return "#ffff33"; // High altitude - yellow
  return "#ff3333"; // Very high altitude - red
};

// Function to get AQI color
const getAQIColor = (aqi) => {
  if (aqi <= 50) return "#00e400"; // Good - Green
  if (aqi <= 100) return "#ffff00"; // Moderate - Yellow
  if (aqi <= 150) return "#ff7e00"; // Unhealthy for Sensitive Groups - Orange
  if (aqi <= 200) return "#ff0000"; // Unhealthy - Red
  if (aqi <= 300) return "#99004c"; // Very Unhealthy - Purple
  return "#7e0023"; // Hazardous - Maroon
};

// Function to get AQI status
const getAQIStatus = (aqi) => {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
};

// Function to get AQI from OpenAQ API
const fetchAirQuality = async (lat, lon) => {
  let openAqUrl = '';

  try {
    // Use the OPENAQ API with the key from environment variables
    const openaqApiKey = import.meta.env.VITE_OPENAQ_API_KEY;
    
    if (openaqApiKey) {
      // Format is coordinates=lat,lon with no spaces - use maximum allowed radius and higher limit
      openAqUrl = `/openaq/v3/locations?coordinates=${lat},${lon}&radius=25000&limit=10`; // Maximum radius is 25km, increased limit to 10
      
      const locationsResponse = await axios.get(openAqUrl, { 
        timeout: 15000, // Increased timeout
        headers: { 
          "X-API-Key": openaqApiKey,  // API key must be sent in X-API-Key header
          "Accept": "application/json"
        }
      });
      
      if (locationsResponse.data?.results?.length > 0) {
        // Sort by distance if provided
        const locations = locationsResponse.data.results;
        
        // For each location, calculate distance and check for PM2.5 sensors
        for (const location of locations) {
          let distanceKm = null;
          if (location.coordinates && location.coordinates.latitude && location.coordinates.longitude) {
            const stationLat = location.coordinates.latitude;
            const stationLon = location.coordinates.longitude;
            distanceKm = calculateDistance(lat, lon, stationLat, stationLon);
          }
          
          // Use a more generous distance filter (100km)
          if (distanceKm !== null && distanceKm <= 100) {
            const locationId = location.id;
            const latestUrl = `/openaq/v3/locations/${locationId}/latest`;
            
            const latestResponse = await axios.get(latestUrl, {
              timeout: 15000,
              headers: { 
                "X-API-Key": openaqApiKey,
                "Accept": "application/json"
              }
            });
            
            if (latestResponse.data && latestResponse.data.results) {
              let pm25Value = null;
              let pm25SensorId = null;
              let pm25SensorName = null;
              let locationName = location.name || 'Unknown Location';
              locationName += ` (${Math.round(distanceKm)} km away)`;
              
              // Loop through the results to find PM2.5 measurements
              if (latestResponse.data.results.length > 0) {
                // First check for known PM2.5 sensor IDs we've identified
                const knownPM25SensorIds = [1437]; // From the screenshot, sensor 1437 appears to be PM2.5
                
                // First check if we have data from any known PM2.5 sensors
                for (const measurement of latestResponse.data.results) {
                  if (knownPM25SensorIds.includes(measurement.sensorsId)) {
                    pm25Value = measurement.value;
                    pm25SensorId = measurement.sensorsId;
                    pm25SensorName = "Known PM2.5 sensor";
                    break;
                  }
                }
                
                // If we haven't found a PM2.5 value yet, try the other detection methods
                if (pm25Value === null) {
                  for (const measurement of latestResponse.data.results) {
                    // Check for PM2.5 values in various possible formats
                    // Option 1: Direct parameter check
                    if (measurement.parameter?.name === 'pm25' || measurement.parameter?.id === 2) {
                      pm25Value = measurement.value;
                      pm25SensorId = measurement.sensorsId || measurement.sensor?.id;
                      pm25SensorName = measurement.parameter?.name || "PM2.5";
                      break;
                    }
                    
                    // Option 2: Via sensor reference
                    if (measurement.sensor?.parameter?.name === 'pm25' || measurement.sensor?.parameter?.id === 2) {
                      pm25Value = measurement.value;
                      pm25SensorId = measurement.sensorsId || measurement.sensor?.id;
                      pm25SensorName = measurement.sensor?.parameter?.name || "PM2.5";
                      break;
                    }
                    
                    // Option 3: Via sensorsId lookup
                    if (measurement.sensorsId) {
                      const matchingSensor = location.sensors?.find(s => s.id === measurement.sensorsId);
                      if (matchingSensor && (matchingSensor.parameter?.name === 'pm25' || matchingSensor.parameter?.id === 2)) {
                        pm25Value = measurement.value;
                        pm25SensorId = measurement.sensorsId;
                        pm25SensorName = matchingSensor.parameter?.name || "PM2.5";
                        break;
                      }
                    }
                    
                    // Option 4: Check unit or name for PM2.5 indicators
                    const measurementName = measurement.name || measurement.sensor?.name || '';
                    if (measurementName.toLowerCase().includes('pm25') || measurementName.toLowerCase().includes('pm2.5')) {
                      pm25Value = measurement.value;
                      pm25SensorId = measurement.sensorsId || measurement.sensor?.id;
                      pm25SensorName = measurementName;
                      break;
                    }
                  }
                }
              }
              
              if (pm25Value !== null) {
                // For PM2.5 in μg/m³, roughly: AQI = PM2.5 * 4.5 (simplification)
                const aqiValue = Math.round(pm25Value * 4.5);
                
                return {
                  pm25: pm25Value,
                  aqi: aqiValue,
                  status: getAQIStatus(aqiValue),
                  location: locationName,
                  source: "OpenAQ v3",
                  sensorId: pm25SensorId,
                  sensorName: pm25SensorName
                };
              }
            }
          }
        }
      }
    }
    
    // If OpenAQ fails or no data, return noData response
    return {
      noData: true,
      location: `No air quality data available for this location`,
      source: "No Data"
    };
    
  } catch (error) {
    return {
      noData: true,
      error: true,
      location: `Error retrieving air quality data`,
      status: `API Error`, 
      source: "Error"
    };
  }
};

// Function to roughly calculate distance between two coordinates in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return Math.round(d);
}

const deg2rad = (deg) => {
  return deg * (Math.PI/180)
}

// Component to adjust the map view when balloon data changes
function MapUpdater({ balloonData }) {
  const map = useMap();
  
  // Use useLayoutEffect to ensure this runs after DOM mutations but before paint
  useLayoutEffect(() => {
    if (map) { // Ensure map instance exists
      if (balloonData.length > 0) {
        const lats = balloonData.map(b => b[0]);
        const lons = balloonData.map(b => b[1]);
        
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);
        
        // Ensure bounds are valid before fitting
        if (isFinite(minLat) && isFinite(maxLat) && isFinite(minLon) && isFinite(maxLon)) {
          map.fitBounds([
            [minLat, minLon],
            [maxLat, maxLon]
          ], { padding: [50, 50] }); // Added padding
        } else {
          // Fallback if bounds are not valid (e.g., single point or no points)
          map.setView([0,0], 2); // Reset to a global view
        }
      } else {
        // If no balloon data, set to a default global view
        map.setView([0,0], 2);
      }

      // It's good practice to invalidate size after programmatic view changes
      // especially if the map container might have been resized or initialized hidden.
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 100); // A small delay can help ensure DOM is settled

      return () => clearTimeout(timer); // Cleanup timer
    }
  }, [balloonData, map]); // map dependency is important
  
  return null;
}

function Map({ balloonData }) {
  return (
    <div className="map-container">
      <MapContainer 
        center={[0, 0]} 
        zoom={2} 
        style={{ height: '100%', width: '100%', background: '#a4c9de' }}
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={1.0}
        minZoom={2.5}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          noWrap={true}
        />
        
        {balloonData.map((balloon, index) => (
          <BalloonMarker key={index} balloon={balloon} index={index} />
        ))}
        
        <MapUpdater balloonData={balloonData} />
        
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            zIndex: 1000,
            p: 2,
            borderRadius: 2,
            maxWidth: 250
          }}
        >
          <Typography variant="h6" sx={{ mb: 1, fontSize: '1rem' }}>
            Altitude
          </Typography>
          {[
            { color: "#3388ff", label: "< 5 km" },
            { color: "#33ff88", label: "5-10 km" },
            { color: "#ffff33", label: "10-15 km" },
            { color: "#ff3333", label: "> 15 km" }
          ].map((item, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box 
                sx={{ 
                  width: 20, 
                  height: 20, 
                  borderRadius: '50%', 
                  bgcolor: item.color,
                  mr: 1
                }}
              />
              <Typography variant="body2">{item.label}</Typography>
            </Box>
          ))}
          
          <Typography variant="h6" sx={{ mt: 2, mb: 1, fontSize: '1rem' }}>
            Air Quality Index
          </Typography>
          {[
            { color: "#00e400", label: "Good (0-50)" },
            { color: "#ffff00", label: "Moderate (51-100)" },
            { color: "#ff7e00", label: "Unhealthy for Sensitive Groups (101-150)" },
            { color: "#ff0000", label: "Unhealthy (151-200)" }
          ].map((item, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box 
                sx={{ 
                  width: 20, 
                  height: 20, 
                  borderRadius: '50%', 
                  bgcolor: item.color,
                  mr: 1
                }}
              />
              <Typography variant="body2">{item.label}</Typography>
            </Box>
          ))}
        </Paper>
      </MapContainer>
    </div>
  );
}

// Separate component for balloon markers to handle air quality data loading
function BalloonMarker({ balloon, index }) {
  const [lat, lon, altitude] = balloon;
  const [airQuality, setAirQuality] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Load air quality data when popup is opened
  const handlePopupOpen = () => {
    if (!airQuality && !isLoading) {
      const loadAirQuality = async () => {
        setIsLoading(true);
        const data = await fetchAirQuality(lat, lon);
        setAirQuality(data);
        setIsLoading(false);
      };
      
      loadAirQuality();
    }
  };
  
  return (
    <CircleMarker
      center={[lat, lon]}
      radius={8}
      color={getAltitudeColor(altitude)}
      fillOpacity={0.8}
      eventHandlers={{
        popupopen: handlePopupOpen
      }}
      className="fade-in"
    >
      <Popup className="balloon-popup">
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontSize: '1.1rem', mb: 1 }}>
            Balloon {index + 1}
          </Typography>
          
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Latitude:</strong> {lat.toFixed(4)}
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Longitude:</strong> {lon.toFixed(4)}
            </Typography>
            <Typography variant="body2">
              <strong>Altitude:</strong> {altitude.toFixed(2)} km
            </Typography>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Typography variant="subtitle2" sx={{ mt: 1, mb: 1.5 }}>
            Air Quality Data
          </Typography>
          
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress size={24} thickness={4} />
            </Box>
          ) : airQuality ? (
            <>
              {airQuality.location && (
                <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic' }}>
                  {airQuality.location}
                </Typography>
              )}
              
              {airQuality.noData ? (
                <Typography variant="body2" sx={{ my: 1, color: 'text.secondary' }}>
                  No air quality data available from monitoring stations in this area.
                </Typography>
              ) : (
                <>
                  {airQuality.pm25 !== null ? (
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>PM2.5:</strong> {airQuality.pm25.toFixed(2)} µg/m³
                    </Typography>
                  ) : (
                    <Typography variant="body2" sx={{ mb: 0.5, fontStyle: 'italic' }}>
                      PM2.5 data unavailable
                    </Typography>
                  )}
                  
                  {airQuality.aqi !== null ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        <strong>AQI:</strong>
                      </Typography>
                      <Chip 
                        label={airQuality.aqi}
                        size="small" 
                        sx={{ 
                          bgcolor: getAQIColor(airQuality.aqi),
                          color: airQuality.aqi <= 100 && airQuality.aqi !== null ? 'black' : 'white',
                          fontWeight: 'bold',
                          minWidth: '40px'
                        }} 
                      />
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ mb: 0.5, fontStyle: 'italic' }}>
                      AQI data unavailable
                    </Typography>
                  )}
                  
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    <strong>Status:</strong> {airQuality.status}
                  </Typography>
                  
                  {airQuality.sensorId && (
                    <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.8rem', color: 'text.secondary' }}>
                      <strong>Sensor ID:</strong> {airQuality.sensorId}
                    </Typography>
                  )}
                </>
              )}
              
              {airQuality.source && airQuality.source !== 'N/A' && airQuality.source !== 'No Data' && airQuality.source !== 'Error' && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                  Source: {airQuality.source}
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="body2" sx={{ my: 2, textAlign: 'center', fontStyle: 'italic' }}>
              Click to load air quality data.
            </Typography>
          )}
        </Box>
      </Popup>
    </CircleMarker>
  );
}

export default Map; 