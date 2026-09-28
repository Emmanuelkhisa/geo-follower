import { useState } from 'react';
import { LocationData } from '@/utils/locationUtils';
import MapProviderSelector, { MapProviderType } from './MapProviderSelector';
import GoogleMap from './GoogleMap';
import MapboxMap from './maps/MapboxMap';
import IframeMap from './maps/IframeMap';

interface TrackerMapProps {
  locationData: LocationData | null;
  followMode?: boolean;
  onToggleFollowMode?: () => void;
}

const TrackerMap = ({ locationData, followMode = false, onToggleFollowMode }: TrackerMapProps) => {
  const [mapProvider, setMapProvider] = useState<MapProviderType>(
    (localStorage.getItem('map_provider') as MapProviderType) || 'iframe'
  );

  // Handle map provider change
  const handleProviderChange = (provider: MapProviderType) => {
    setMapProvider(provider);
    localStorage.setItem('map_provider', provider);
  };

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden shadow-lg bg-slate-950">
      {mapProvider === 'google' ? (
        <GoogleMap 
          locationData={locationData} 
          followMode={followMode} 
          onToggleFollowMode={onToggleFollowMode} 
        />
      ) : mapProvider === 'mapbox' ? (
        <MapboxMap 
          locationData={locationData}
          followMode={followMode}
          onToggleFollowMode={onToggleFollowMode}
        />
      ) : (
        <IframeMap
          locationData={locationData}
          followMode={followMode}
          onToggleFollowMode={onToggleFollowMode}
        />
      )}

      {/* Floating Provider Selection Control */}
      <div className="absolute bottom-4 left-4 z-20">
        <MapProviderSelector
          provider={mapProvider}
          onProviderChange={handleProviderChange}
        />
      </div>
    </div>
  );
};

export default TrackerMap;
