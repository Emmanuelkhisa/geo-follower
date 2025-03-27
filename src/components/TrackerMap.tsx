
import { useEffect, useRef, useState } from 'react';
import { LocationData } from '@/utils/locationUtils';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Navigation } from 'lucide-react';

// Set default token to your public token
const DEFAULT_MAPBOX_TOKEN = "pk.eyJ1IjoidHJlYWxlciIsImEiOiJjbThxN2VhMGkwZWtoMmpxeGFqNG1jMzV3In0.LrKqNjHZ8WpyYnav1EIWXQ";

interface TrackerMapProps {
  locationData: LocationData | null;
  followMode?: boolean;
  onToggleFollowMode?: () => void;
}

const TrackerMap = ({ locationData, followMode = false, onToggleFollowMode }: TrackerMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string>(localStorage.getItem('mapbox_token') || DEFAULT_MAPBOX_TOKEN);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapboxgl, setMapboxgl] = useState<any>(null);
  const initialLoadRef = useRef(true);

  // Dynamically import mapbox-gl
  useEffect(() => {
    if (!mapboxToken) return;
    
    const loadMapbox = async () => {
      try {
        // Try to load Mapbox GL JS
        const mapboxModule = await import('mapbox-gl').catch(error => {
          console.error('Failed to import mapbox-gl:', error);
          setMapError('Failed to load map library. Please check your internet connection and try again.');
          return null;
        });
        
        if (!mapboxModule) return;
        
        const mapboxgl = mapboxModule.default;
        setMapboxgl(mapboxgl);
        
        // Set access token
        mapboxgl.accessToken = mapboxToken;
        setMapboxLoaded(true);
        
        if (!mapContainer.current) return;
        
        try {
          map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12', // Using streets style for better location context
            center: locationData ? [locationData.longitude, locationData.latitude] : [36.8219, 1.2921], // Default to Nairobi if no location
            zoom: locationData ? 15 : 12,
            pitch: 45,
            attributionControl: false,
            antialias: true,
            failIfMajorPerformanceCaveat: true
          });

          map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
          map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

          map.current.on('style.load', () => {
            if (map.current) {
              // Add 3D terrain
              map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
              
              // Add the DEM source as a terrain layer with exaggerated height
              map.current.addSource('mapbox-dem', {
                'type': 'raster-dem',
                'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                'tileSize': 512,
                'maxzoom': 14
              });
              
              // Add realistic fog
              map.current.setFog({
                'color': 'rgb(255, 255, 255)',
                'high-color': 'rgb(200, 200, 225)',
                'horizon-blend': 0.2
              });
            }
            setMapLoaded(true);
            setMapError(null);
          });
          
          map.current.on('error', (e: any) => {
            console.error('Map error:', e);
            if (e.error && e.error.status === 401) {
              setMapError('Invalid Mapbox token. Please provide a valid token.');
              setShowTokenInput(true);
            } else if (e.error && (e.error.status === 404 || e.error.status === 400)) {
              setMapError('Unable to load map style. Please check your internet connection or try a different browser.');
            } else {
              setMapError('Error loading map. Please try with a different browser or device.');
            }
          });
        } catch (error) {
          console.error('Error initializing map:', error);
          toast({
            title: 'Error',
            description: 'Failed to initialize map. Please check your browser compatibility or try a different browser.',
            variant: 'destructive',
          });
          setShowTokenInput(true);
          setMapError('Failed to initialize map. Your browser may not support WebGL.');
        }
      } catch (error) {
        console.error('Error loading Mapbox GL:', error);
        toast({
          title: 'Error',
          description: 'Failed to load map library',
          variant: 'destructive',
        });
        setMapError('Failed to load map library. Please check your internet connection and try again.');
      }
    };

    loadMapbox();
    
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [mapboxToken]);

  // Update marker when location data changes
  useEffect(() => {
    if (!mapLoaded || !locationData || !map.current || !mapboxgl) return;

    try {
      // Create a blinking marker element
      const el = document.createElement('div');
      el.className = 'relative w-8 h-8';
      
      const innerDiv = document.createElement('div');
      innerDiv.className = 'absolute w-8 h-8 bg-geo-blue rounded-full flex items-center justify-center animate-pulse';
      
      const dot = document.createElement('div');
      dot.className = 'w-3 h-3 bg-white rounded-full';
      
      // Add a pulse animation effect
      const pulseRing = document.createElement('div');
      pulseRing.className = 'absolute w-8 h-8 rounded-full border-4 border-geo-blue animate-ping opacity-75';
      
      el.appendChild(pulseRing);
      innerDiv.appendChild(dot);
      el.appendChild(innerDiv);

      if (marker.current) {
        marker.current.remove();
      }

      marker.current = new mapboxgl.Marker(el)
        .setLngLat([locationData.longitude, locationData.latitude])
        .addTo(map.current);

      // Fly to the location with animation if in follow mode or initial load
      if (followMode || initialLoadRef.current) {
        map.current.flyTo({
          center: [locationData.longitude, locationData.latitude],
          zoom: 15,
          speed: 1.5,
          curve: 1,
          essential: true
        });
        initialLoadRef.current = false;
      }

      // Add accuracy circle if not already added
      const accuracyCircleId = 'accuracy-circle';
      
      if (map.current.getSource(accuracyCircleId)) {
        const source = map.current.getSource(accuracyCircleId);
        if (source) {
          source.setData({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [locationData.longitude, locationData.latitude]
            },
            properties: {
              accuracy: locationData.accuracy
            }
          });
        }
      } else {
        // Check if map is fully loaded before adding source
        if (map.current.loaded()) {
          try {
            map.current.addSource(accuracyCircleId, {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [locationData.longitude, locationData.latitude]
                },
                properties: {
                  accuracy: locationData.accuracy
                }
              }
            });

            map.current.addLayer({
              id: accuracyCircleId,
              type: 'circle',
              source: accuracyCircleId,
              paint: {
                'circle-radius': {
                  stops: [
                    [0, 0],
                    [20, locationData.accuracy / 2]
                  ],
                  base: 2
                },
                'circle-color': '#3B82F6',
                'circle-opacity': 0.15,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#3B82F6',
                'circle-stroke-opacity': 0.3
              }
            });
          } catch (e) {
            console.warn('Could not add accuracy circle', e);
          }
        } else {
          // If map is not fully loaded, wait for the load event
          map.current.on('load', () => {
            // Only add the source if it doesn't already exist
            if (!map.current.getSource(accuracyCircleId)) {
              try {
                map.current.addSource(accuracyCircleId, {
                  type: 'geojson',
                  data: {
                    type: 'Feature',
                    geometry: {
                      type: 'Point',
                      coordinates: [locationData.longitude, locationData.latitude]
                    },
                    properties: {
                      accuracy: locationData.accuracy
                    }
                  }
                });

                map.current.addLayer({
                  id: accuracyCircleId,
                  type: 'circle',
                  source: accuracyCircleId,
                  paint: {
                    'circle-radius': {
                      stops: [
                        [0, 0],
                        [20, locationData.accuracy / 2]
                      ],
                      base: 2
                    },
                    'circle-color': '#3B82F6',
                    'circle-opacity': 0.15,
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#3B82F6',
                    'circle-stroke-opacity': 0.3
                  }
                });
              } catch (e) {
                console.warn('Could not add accuracy circle on load', e);
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error updating marker:', error);
    }
  }, [mapLoaded, locationData, mapboxgl, followMode]);

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem('mapboxToken') as HTMLInputElement;
    
    if (input.value.trim()) {
      setMapboxToken(input.value.trim());
      setShowTokenInput(false);
      setMapError(null);
      
      // Store token in localStorage for future use
      localStorage.setItem('mapbox_token', input.value.trim());
    }
  };

  const handleResetToken = () => {
    // Reset to default token
    setMapboxToken(DEFAULT_MAPBOX_TOKEN);
    localStorage.setItem('mapbox_token', DEFAULT_MAPBOX_TOKEN);
    setShowTokenInput(false);
    setMapError(null);
    
    // Reload the map
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    setMapLoaded(false);
    setMapboxLoaded(false);
  };

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden shadow-lg">
      {showTokenInput ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 p-4">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Mapbox Token Required</h3>
            {mapError && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm">
                {mapError}
              </div>
            )}
            <p className="text-sm text-muted-foreground mb-4">
              Please enter your Mapbox public access token to display the map. You can get one by creating a free account at{' '}
              <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-geo-blue hover:underline">
                mapbox.com
              </a>
            </p>
            <form onSubmit={handleTokenSubmit} className="space-y-4">
              <input
                type="text"
                name="mapboxToken"
                placeholder="pk.eyJ1..."
                defaultValue={mapboxToken !== DEFAULT_MAPBOX_TOKEN ? mapboxToken : ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <div className="flex flex-col space-y-2">
                <Button type="submit" className="w-full">
                  Set Custom Token
                </Button>
                <Button type="button" variant="outline" onClick={handleResetToken} className="w-full">
                  Use Default Token
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <>
          <div ref={mapContainer} className="absolute inset-0" />
          {!mapboxLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 backdrop-blur-sm">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-geo-blue mx-auto"></div>
                <p className="mt-4 text-sm text-gray-500">Loading map...</p>
              </div>
            </div>
          )}
          {mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
                <h3 className="text-lg font-medium mb-4 text-red-600 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Map Error
                </h3>
                <p className="mb-4">{mapError}</p>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => setShowTokenInput(true)} 
                    className="flex-1"
                  >
                    Change Token
                  </Button>
                  <Button 
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="flex-1"
                  >
                    Reload Page
                  </Button>
                </div>
              </div>
            </div>
          )}
          <div className="absolute bottom-4 right-4 z-10 flex gap-2">
            {onToggleFollowMode && locationData && (
              <Button 
                onClick={onToggleFollowMode} 
                variant={followMode ? "default" : "outline"}
                size="sm"
                className={followMode ? "bg-geo-blue hover:bg-geo-blue/90" : "bg-white/80 hover:bg-white shadow-md"}
              >
                <Navigation className={followMode ? "animate-pulse" : ""} size={16} />
                {followMode ? "Following" : "Follow Device"}
              </Button>
            )}
            <Button 
              onClick={() => setShowTokenInput(true)} 
              variant="outline" 
              size="sm"
              className="bg-white/80 hover:bg-white shadow-md"
            >
              Change Map Token
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default TrackerMap;
