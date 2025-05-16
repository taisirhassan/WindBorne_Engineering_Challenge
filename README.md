# WindBorne Air Quality Tracker

This project is a visualization tool that combines WindBorne's constellation of atmospheric balloons with air quality data. The application displays the real-time positions of WindBorne's balloons on an interactive map and provides information about air quality at those locations.

## Features

- Interactive map visualization of WindBorne's balloon constellation
- Real-time updates of balloon positions
- Historical data viewing (up to 23 hours ago)
- Air quality information at balloon locations
- Color-coded altitude indicators
- Responsive design for desktop and mobile devices
- Dark/Light mode theme support

## Technologies Used

- React 19
- Vite
- Material UI for components and theming
- Leaflet for map visualization
- Axios for data fetching
- React Query for efficient data management
- OpenStreetMap for map tiles

## How It Works

The application fetches data from WindBorne's constellation API and plots the positions of their atmospheric balloons on a map. Each balloon is represented by a colored marker, with the color indicating the balloon's altitude.

When you click on a balloon marker, a popup displays detailed information about the balloon, including its coordinates, altitude, and air quality data at that location.

You can view historical data by selecting different time points from the dropdown menu at the top of the page.

## Node.js Compatibility

This project uses Vite with `"type": "module"` in package.json, which means it uses ES modules by default. We use the standard `p-limit` package, which is an ESM package but compatible with modern Node.js environments. If you encounter any issues with the package in CommonJS environments, you may need to use the `--experimental-modules` flag or update to a more recent Node.js version that has better ESM support.

## Why Air Quality Visualization?

Atmospheric balloons provide a unique opportunity to monitor air quality at various altitudes and across different regions. By combining this data with air quality information, we can help:

1. Track pollution dispersion patterns
2. Monitor the vertical distribution of pollutants
3. Identify areas with high pollution levels
4. Provide early warnings for air quality issues

Air quality monitoring is critical for public health and environmental management. This project demonstrates how WindBorne's balloon constellation can contribute to these efforts.

## Note on Air Quality Data

For demonstration purposes, this application uses simulated air quality data. In a production environment, this would be replaced with real data from air quality monitoring APIs such as EPA's AirNow, OpenAQ, or similar services.

## Getting Started

```bash
# Clone the repository
git clone [repository-url]

# Navigate to the project directory
cd windborne-air-quality

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Deployment

### Deploying to Vercel

This project is optimized for deployment on Vercel. Follow these steps to deploy:

1. **Install Vercel CLI** (if you haven't already):
   ```bash
   npm install -g vercel
   ```

2. **Configure Environment Variables**:
   - Create a `.env` file for local development
   - For production, you'll need to set the following environment variables in your Vercel project settings:
     - `VITE_OPENAQ_API_KEY`: Your OpenAQ API key

3. **Deploy using Vercel CLI**:
   ```bash
   # Login to Vercel
   vercel login
   
   # Deploy to Vercel
   vercel
   
   # For production deployment
   vercel --prod
   ```

4. **Deploy using Vercel UI**:
   - Push your code to GitHub, GitLab, or Bitbucket
   - Import the project in Vercel dashboard
   - Configure the build settings (these are already set in `vercel.json`):
     - Framework Preset: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - Add the required environment variables
   - Deploy

### Notes on Deployment

- The application uses API path rewriting to avoid CORS issues, which is configured in `vercel.json`
- The `/treasure/*` paths are proxied to WindBorne's API
- The `/openaq/*` paths are proxied to OpenAQ's API

## Future Enhancements

- Integration with real air quality APIs
- Time-series visualization of air quality changes
- Predictive air quality modeling based on balloon trajectory
- Enhanced filtering options for data visualization
- Mobile app version for on-the-go access
