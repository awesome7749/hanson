import React from 'react';
import './StreetViewImage.css';

interface SatelliteViewImageProps {
  latitude: number;
  longitude: number;
  width?: number;
  height?: number;
  zoom?: number; // Zoom level (1-20, higher = more zoomed in)
  mapType?: 'satellite' | 'hybrid'; // satellite or hybrid (satellite + labels)
}

const SatelliteViewImage: React.FC<SatelliteViewImageProps> = ({
  latitude,
  longitude,
  width = 600,
  height = 400,
  zoom = 18, // 18 is good for seeing property details
  mapType = 'satellite',
}) => {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    return (
      <div className="street-view-error">
        Google Maps API key not configured. Please add it to .env file.
      </div>
    );
  }

  const satelliteUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${width}x${height}&maptype=${mapType}&key=${apiKey}`;

  return (
    <div className="street-view-container">
      <h3>🛰️ Satellite View</h3>
      <img
        src={satelliteUrl}
        alt={`Satellite view at ${latitude}, ${longitude}`}
        className="street-view-image"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const errorDiv = target.nextElementSibling as HTMLElement;
          if (errorDiv) errorDiv.style.display = 'block';
        }}
      />
      <div className="street-view-no-image" style={{ display: 'none' }}>
        Unable to load satellite imagery for this location
      </div>
    </div>
  );
};

export default SatelliteViewImage;
