
import { useEffect, useRef, useState } from 'react';
import { LocationData } from '@/utils/locationUtils';
import 'mapbox-gl/dist/mapbox-gl.css';
import { toast } from '@/components/ui/use-toast';

// You would need to replace this with your actual Mapbox token
// For security, in a production app, this should be stored in an environment variable
const MAPBOX_TOKEN = 'REPLACE_WITH_YOUR_MAPBOX_TOKEN';

let mapboxgl: any;

const TrackerMap = ({ locationData }: { locationData: LocationData | null }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);

  // Dynamically import mapbox-gl
  useEffect(() => {
    const loadMapbox = async () => {
      try {
        const mapboxModule = await import('mapbox-gl');
        mapboxgl = mapboxModule.default;
        mapboxgl.accessToken = MAPBOX_TOKEN;
        setMapboxLoaded(true);
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
  }, []);

  // Initialize map when mapbox is loaded
  useEffect(() => {
    if (!mapboxLoaded || !mapContainer.current) return;

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
        map.current.setFog({
          color: 'rgb(255, 255, 255)',
          'high-color': 'rgb(200, 200, 225)',
          'horizon-blend': 0.2,
        });

        setMapLoaded(true);
      });

      return () => {
        if (map.current) {
          map.current.remove();
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize map',
        variant: 'destructive',
      });
    }
  }, [mapboxLoaded, locationData]);

  // Update marker when location data changes
  useEffect(() => {
    if (!mapLoaded || !locationData) return;

    try {
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

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden shadow-lg">
      <div ref={mapContainer} className="absolute inset-0" />
      {!mapboxLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 backdrop-blur-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-geo-blue mx-auto"></div>
            <p className="mt-4 text-sm text-gray-500">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackerMap;
