import React from 'react';
import './StreetViewImage.css';

interface StreetViewImageProps {
  latitude: number;
  longitude: number;
  width?: number;
  height?: number;
  heading?: number; // Direction camera is facing (0-360)
  pitch?: number; // Camera angle up/down (-90 to 90)
  fov?: number; // Field of view (10-120)
}

const StreetViewImage: React.FC<StreetViewImageProps> = ({
  latitude,
  longitude,
  width = 600,
  height = 400,
  heading = 0,
  pitch = 0,
  fov = 90,
}) => {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    return (
      <div className="street-view-error">
        Google Maps API key not configured. Please add it to .env file.
      </div>
    );
  }

  const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=${width}x${height}&location=${latitude},${longitude}&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${apiKey}`;

  return (
    <div className="street-view-container">
      <h3>📸 Street View</h3>
      <img
        src={streetViewUrl}
        alt={`Street view at ${latitude}, ${longitude}`}
        className="street-view-image"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const errorDiv = target.nextElementSibling as HTMLElement;
          if (errorDiv) errorDiv.style.display = 'block';
        }}
      />
      <div className="street-view-no-image" style={{ display: 'none' }}>
        No Street View imagery available for this location
      </div>
    </div>
  );
};

export default StreetViewImage;
