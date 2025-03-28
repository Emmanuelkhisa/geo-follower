import { useState } from 'react';
import { LocationData } from '@/utils/locationUtils';
import MapProviderSelector from './MapProviderSelector';
import GoogleMap from './GoogleMap';
import MapboxMap from './maps/MapboxMap';

interface TrackerMapProps {
  locationData: LocationData | null;
  followMode?: boolean;
  onToggleFollowMode?: () => void;
}

const TrackerMap = ({ locationData, followMode = false, onToggleFollowMode }: TrackerMapProps) => {
  const [mapProvider, setMapProvider] = useState<'mapbox' | 'google'>(
    localStorage.getItem('map_provider') as 'mapbox' | 'google' || 'mapbox'
  );

  // Handle map provider change
  const handleProviderChange = (provider: 'mapbox' | 'google') => {
    setMapProvider(provider);
    localStorage.setItem('map_provider', provider);
  };

  // If Google Maps is selected, render GoogleMap component
  if (mapProvider === 'google') {
    return (
      <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden shadow-lg">
        <GoogleMap 
          locationData={locationData} 
          followMode={followMode} 
          onToggleFollowMode={onToggleFollowMode} 
        />
        <div className="absolute bottom-4 left-4 z-10">
          <MapProviderSelector
            provider={mapProvider}
            onProviderChange={handleProviderChange}
          />
        </div>
      </div>
    );
  }

  // Otherwise render Mapbox
  return (
    <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden shadow-lg">
      <MapboxMap 
        locationData={locationData}
        followMode={followMode}
        onToggleFollowMode={onToggleFollowMode}
      />
      <div className="absolute bottom-4 left-4 z-10">
        <MapProviderSelector
          provider={mapProvider}
          onProviderChange={handleProviderChange}
        />
      </div>
    </div>
  );
};

export default TrackerMap;
