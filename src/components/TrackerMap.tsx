
import { useEffect, useRef, useState } from 'react';
import { LocationData } from '@/utils/locationUtils';
import 'mapbox-gl/dist/mapbox-gl.css';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

// We'll use a state variable to store the token instead of hardcoding it
const TrackerMap = ({ locationData }: { locationData: LocationData | null }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(true);

  // Dynamically import mapbox-gl
  useEffect(() => {
    if (!mapboxToken) return;
    
    const loadMapbox = async () => {
      try {
        const mapboxModule = await import('mapbox-gl');
        const mapboxgl = mapboxModule.default;
        mapboxgl.accessToken = mapboxToken;
        setMapboxLoaded(true);
        
        if (!mapContainer.current) return;
        
        try {
          map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/light-v11',
            center: locationData ? [locationData.longitude, locationData.latitude] : [0, 0],
            zoom: locationData ? 15 : 2,
            pitch: 45,
            attributionControl: false,
          });

          map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
          map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

          map.current.on('style.load', () => {
            if (map.current) {
              map.current.setFog({
                color: 'rgb(255, 255, 255)',
                'high-color': 'rgb(200, 200, 225)',
                'horizon-blend': 0.2,
              });
            }
            setMapLoaded(true);
          });
        } catch (error) {
          console.error('Error initializing map:', error);
          toast({
            title: 'Error',
            description: 'Failed to initialize map. Please check your Mapbox token.',
            variant: 'destructive',
          });
          setShowTokenInput(true);
          setMapboxToken('');
        }
      } catch (error) {
        console.error('Error loading Mapbox GL:', error);
        toast({
          title: 'Error',
          description: 'Failed to load map library',
          variant: 'destructive',
        });
      }
    };

    loadMapbox();
    
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [mapboxToken, locationData]);

  // Update marker when location data changes
  useEffect(() => {
    if (!mapLoaded || !locationData || !map.current) return;

    try {
      const mapboxgl = window.mapboxgl;
      
      const el = document.createElement('div');
      el.className = 'relative w-5 h-5';
      
      const innerDiv = document.createElement('div');
      innerDiv.className = 'absolute w-5 h-5 bg-geo-blue rounded-full flex items-center justify-center location-pulse';
      
      const dot = document.createElement('div');
      dot.className = 'w-2 h-2 bg-white rounded-full';
      
      innerDiv.appendChild(dot);
      el.appendChild(innerDiv);

      if (marker.current) {
        marker.current.remove();
      }

      marker.current = new mapboxgl.Marker(el)
        .setLngLat([locationData.longitude, locationData.latitude])
        .addTo(map.current);

      // Fly to the location with animation
      map.current.flyTo({
        center: [locationData.longitude, locationData.latitude],
        zoom: 15,
        speed: 1.5,
        curve: 1,
        essential: true
      });

      // Add accuracy circle if not already added
      const accuracyCircleId = 'accuracy-circle';
      
      if (map.current.getSource(accuracyCircleId)) {
        map.current.getSource(accuracyCircleId).setData({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [locationData.longitude, locationData.latitude]
          },
          properties: {
            accuracy: locationData.accuracy
          }
        });
      } else {
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
      }
    } catch (error) {
      console.error('Error updating marker:', error);
    }
  }, [mapLoaded, locationData]);

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem('mapboxToken') as HTMLInputElement;
    
    if (input.value.trim()) {
      setMapboxToken(input.value.trim());
      setShowTokenInput(false);
      
      // Store token in localStorage for future use
      localStorage.setItem('mapbox_token', input.value.trim());
    }
  };

  // Check localStorage for token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('mapbox_token');
    if (savedToken) {
      setMapboxToken(savedToken);
      setShowTokenInput(false);
    }
  }, []);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden shadow-lg">
      {showTokenInput ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 p-4">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Mapbox Token Required</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please enter your Mapbox public access token to display the map. You can get one by creating a free account at{' '}
              <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-geo-blue hover:underline">
                mapbox.com
              </a>
            </p>
            <form onSubmit={handleTokenSubmit}>
              <input
                type="text"
                name="mapboxToken"
                placeholder="pk.eyJ1Ijoi..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              />
              <Button type="submit" className="w-full">
                Set Token
              </Button>
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
        </>
      )}
    </div>
  );
};

export default TrackerMap;
