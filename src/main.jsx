import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Debug environment variables
console.log('Environment check:')
console.log('OpenAQ API Key exists:', !!import.meta.env.VITE_OPENAQ_API_KEY)
console.log('OpenAQ API Key first 4 chars:', import.meta.env.VITE_OPENAQ_API_KEY ? import.meta.env.VITE_OPENAQ_API_KEY.substring(0, 4) + '...' : 'none')

// Fix issues with Leaflet icons
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet's default icon paths
delete Icon.Default.prototype._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png'
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
