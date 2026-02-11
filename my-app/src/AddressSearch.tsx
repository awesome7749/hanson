import React, { useState } from 'react';
import './AddressSearch.css';
import StreetViewImage from './StreetViewImage';

interface PropertyData {
  id: string;
  formattedAddress: string;
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  lotSize?: number;
  yearBuilt?: number;
  propertyType?: string;
  lastSalePrice?: number;
  lastSaleDate?: string;
  assessedValue?: number;
  [key: string]: any;
}

const AddressSearch: React.FC = () => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);

  const searchProperty = async () => {
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    const apiKey = process.env.REACT_APP_HANSON_API_KEY;
    if (!apiKey || apiKey === 'your_rentcast_api_key_here') {
      setError('API key not configured. Please add your RentCast API key to .env');
      return;
    }

    setLoading(true);
    setError(null);
    setPropertyData(null);

    try {
      const response = await fetch(
        `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(address)}`,
        {
          method: 'GET',
          headers: {
            'X-Api-Key': apiKey,
            'accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        setPropertyData(data[0]);
      } else {
        setError('No property found for this address');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch property data');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      searchProperty();
    }
  };

  // Extract HVAC-related fields from property data
  const getHVACInfo = () => {
    if (!propertyData) return null;

    const features = propertyData.features || {};
    
    const hvacFields = [
      'heating', 'heatingType', 'heatingSource', 'heatingFuel',
      'cooling', 'coolingType', 'airConditioning', 'ac',
      'hvac', 'hvacType'
    ];

    const hvacData: { [key: string]: any } = {};
    
    hvacFields.forEach(field => {
      if (features[field] !== undefined && features[field] !== null) {
        hvacData[field] = features[field];
      }
    });

    return Object.keys(hvacData).length > 0 ? hvacData : null;
  };

  return (
    <div className="address-search">
      <div className="search-container">
        <h1>Property Search</h1>
        <p className="subtitle">Enter an address to get property information</p>
        
        <div className="input-group">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., 123 Main St, San Francisco, CA 94102"
            className="address-input"
            disabled={loading}
          />
          <button 
            onClick={searchProperty} 
            disabled={loading}
            className="search-button"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {propertyData && (
          <div className="property-card">
            <h2>Property Information</h2>
            
            {/* Street View Image */}
            {propertyData.latitude && propertyData.longitude && (
              <StreetViewImage
                latitude={propertyData.latitude}
                longitude={propertyData.longitude}
                width={600}
                height={400}
              />
            )}
            
            {/* HVAC Information - Highlighted */}
            {getHVACInfo() && (
              <div className="hvac-section">
                <h3>🔥 HVAC & Heating/Cooling Systems</h3>
                <div className="hvac-details">
                  {Object.entries(getHVACInfo()!).map(([key, value]) => (
                    <div key={key} className="detail-row hvac-row">
                      <span className="label">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="value">
                        {typeof value === 'boolean' ? (value ? '✓ Yes' : '✗ No') : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="property-details">
              <div className="detail-row">
                <span className="label">Address:</span>
                <span className="value">{propertyData.formattedAddress || propertyData.addressLine1}</span>
              </div>
              <div className="detail-row">
                <span className="label">City:</span>
                <span className="value">{propertyData.city}, {propertyData.state} {propertyData.zipCode}</span>
              </div>
              {propertyData.propertyType && (
                <div className="detail-row">
                  <span className="label">Type:</span>
                  <span className="value">{propertyData.propertyType}</span>
                </div>
              )}
              {propertyData.bedrooms !== undefined && (
                <div className="detail-row">
                  <span className="label">Bedrooms:</span>
                  <span className="value">{propertyData.bedrooms}</span>
                </div>
              )}
              {propertyData.bathrooms !== undefined && (
                <div className="detail-row">
                  <span className="label">Bathrooms:</span>
                  <span className="value">{propertyData.bathrooms}</span>
                </div>
              )}
              {propertyData.squareFootage && (
                <div className="detail-row">
                  <span className="label">Square Footage:</span>
                  <span className="value">{propertyData.squareFootage.toLocaleString()} sq ft</span>
                </div>
              )}
              {propertyData.lotSize && (
                <div className="detail-row">
                  <span className="label">Lot Size:</span>
                  <span className="value">{propertyData.lotSize.toLocaleString()} sq ft</span>
                </div>
              )}
              {propertyData.yearBuilt && (
                <div className="detail-row">
                  <span className="label">Year Built:</span>
                  <span className="value">{propertyData.yearBuilt}</span>
                </div>
              )}
              {propertyData.lastSalePrice && (
                <div className="detail-row">
                  <span className="label">Last Sale Price:</span>
                  <span className="value">${propertyData.lastSalePrice.toLocaleString()}</span>
                </div>
              )}
              {propertyData.lastSaleDate && (
                <div className="detail-row">
                  <span className="label">Last Sale Date:</span>
                  <span className="value">{new Date(propertyData.lastSaleDate).toLocaleDateString()}</span>
                </div>
              )}
              {propertyData.assessedValue && (
                <div className="detail-row">
                  <span className="label">Assessed Value:</span>
                  <span className="value">${propertyData.assessedValue.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Debug: Show all available fields */}
            <details className="debug-section">
              <summary>View all available data fields</summary>
              <pre className="debug-data">
                {JSON.stringify(propertyData, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressSearch;
