
import { useEffect, useRef, useState } from 'react';
import { LocationData } from '@/utils/locationUtils';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  const [distance, setDistance] = useState<number | null>(null);
  const [travelTime, setTravelTime] = useState<string | null>(null);

  // Calculate distance between two points in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate estimated travel time based on walking speed (4 km/h)
  const calculateTravelTime = (distanceInMeters: number): string => {
    const walkingSpeedMetersPerMinute = 4000 / 60;
    const minutes = Math.round(distanceInMeters / walkingSpeedMetersPerMinute);
    
    if (minutes < 1) {
      return "Less than a minute";
    } else if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? '' : 's'}`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} hour${hours === 1 ? '' : 's'}${remainingMinutes > 0 ? ` ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}` : ''}`;
    }
  };

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
            style: 'mapbox://styles/mapbox/navigation-night-v1', // Changed to dark street view with buildings
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
              // Add 3D buildings layer for better visibility
              const layers = map.current.getStyle().layers;
              let labelLayerId;
              for (let i = 0; i < layers.length; i++) {
                if (layers[i].type === 'symbol' && layers[i].layout && layers[i].layout['text-field']) {
                  labelLayerId = layers[i].id;
                  break;
                }
              }

              map.current.addLayer(
                {
                  'id': '3d-buildings',
                  'source': 'composite',
                  'source-layer': 'building',
                  'filter': ['==', 'extrude', 'true'],
                  'type': 'fill-extrusion',
                  'minzoom': 15,
                  'paint': {
                    'fill-extrusion-color': '#aaa',
                    'fill-extrusion-height': [
                      'interpolate', ['linear'], ['zoom'],
                      15, 0,
                      15.05, ['get', 'height']
                    ],
                    'fill-extrusion-base': [
                      'interpolate', ['linear'], ['zoom'],
                      15, 0,
                      15.05, ['get', 'min_height']
                    ],
                    'fill-extrusion-opacity': 0.6
                  }
                },
                labelLayerId
              );
              
              // Add fog for atmospheric effect
              map.current.setFog({
                'color': 'rgb(5, 5, 10)',
                'high-color': 'rgb(10, 10, 20)',
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
      // Create a blinking marker element for tracked device (RED)
      const el = document.createElement('div');
      el.className = 'relative w-10 h-10'; // Increased size for better visibility
      
      const innerDiv = document.createElement('div');
      innerDiv.className = 'absolute w-10 h-10 bg-red-600 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(255,0,0,0.7)]'; // Added glow effect
      
      const dot = document.createElement('div');
      dot.className = 'w-4 h-4 bg-white rounded-full'; // Increased size of inner dot
      
      // Add a pulse animation effect
      const pulseRing = document.createElement('div');
      pulseRing.className = 'absolute w-10 h-10 rounded-full border-4 border-red-600 animate-ping opacity-75';
      
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

      // Add accuracy circle if not already added (YELLOW for path/route)
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
                'circle-color': '#FFD700', // Yellow color for path/route
                'circle-opacity': 0.25, // Increased opacity for better visibility
                'circle-stroke-width': 2, // Thicker stroke
                'circle-stroke-color': '#FFD700', // Yellow color for path/route
                'circle-stroke-opacity': 0.5 // Increased opacity for better visibility
              }
            });

            // Add a "current location" marker (BLUE)
            // This is a simulated current device location for demonstration
            // In a real app, you would get this from the device's GPS
            const currentLocationOffset = 0.001; // Small offset for demonstration
            
            const currentLocationEl = document.createElement('div');
            currentLocationEl.className = 'relative w-8 h-8'; // Increased size for better visibility
            
            const currentInnerDiv = document.createElement('div');
            currentInnerDiv.className = 'absolute w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,255,0.7)]'; // Added glow effect
            
            const currentDot = document.createElement('div');
            currentDot.className = 'w-3 h-3 bg-white rounded-full'; // Increased size
            
            currentInnerDiv.appendChild(currentDot);
            currentLocationEl.appendChild(currentInnerDiv);

            const currentLocation = [
              locationData.longitude + currentLocationOffset,
              locationData.latitude + currentLocationOffset
            ];

            new mapboxgl.Marker(currentLocationEl)
              .setLngLat(currentLocation)
              .addTo(map.current);
              
            // Calculate distance and travel time
            const distanceInMeters = calculateDistance(
              locationData.latitude, 
              locationData.longitude,
              locationData.latitude + currentLocationOffset,
              locationData.longitude + currentLocationOffset
            );
            
            setDistance(distanceInMeters);
            setTravelTime(calculateTravelTime(distanceInMeters));
            
            // Add line between current and tracked location
            if (map.current.getSource('route')) {
              const source = map.current.getSource('route');
              if (source) {
                source.setData({
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: [
                      currentLocation,
                      [locationData.longitude, locationData.latitude]
                    ]
                  }
                });
              }
            } else {
              map.current.addSource('route', {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: [
                      currentLocation,
                      [locationData.longitude, locationData.latitude]
                    ]
                  }
                }
              });
              
              map.current.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round'
                },
                paint: {
                  'line-color': '#FFD700',
                  'line-width': 4,
                  'line-opacity': 0.8,
                  'line-dasharray': [2, 1]
                }
              });
            }
              
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
                    'circle-color': '#FFD700', // Yellow color for path/route
                    'circle-opacity': 0.25, // Increased opacity
                    'circle-stroke-width': 2, // Thicker stroke
                    'circle-stroke-color': '#FFD700', // Yellow color for path/route
                    'circle-stroke-opacity': 0.5 // Increased opacity
                  }
                });
                
                // Add a "current location" marker (BLUE)
                const currentLocationOffset = 0.001; // Small offset for demonstration
                
                const currentLocationEl = document.createElement('div');
                currentLocationEl.className = 'relative w-8 h-8'; // Increased size
                
                const currentInnerDiv = document.createElement('div');
                currentInnerDiv.className = 'absolute w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,255,0.7)]'; // Added glow
                
                const currentDot = document.createElement('div');
                currentDot.className = 'w-3 h-3 bg-white rounded-full';
                
                currentInnerDiv.appendChild(currentDot);
                currentLocationEl.appendChild(currentInnerDiv);

                const currentLocation = [
                  locationData.longitude + currentLocationOffset,
                  locationData.latitude + currentLocationOffset
                ];

                new mapboxgl.Marker(currentLocationEl)
                  .setLngLat(currentLocation)
                  .addTo(map.current);
                  
                // Calculate distance and travel time
                const distanceInMeters = calculateDistance(
                  locationData.latitude, 
                  locationData.longitude,
                  locationData.latitude + currentLocationOffset,
                  locationData.longitude + currentLocationOffset
                );
                
                setDistance(distanceInMeters);
                setTravelTime(calculateTravelTime(distanceInMeters));
                
                // Add line between current and tracked location
                map.current.addSource('route', {
                  type: 'geojson',
                  data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                      type: 'LineString',
                      coordinates: [
                        currentLocation,
                        [locationData.longitude, locationData.latitude]
                      ]
                    }
                  }
                });
                
                map.current.addLayer({
                  id: 'route',
                  type: 'line',
                  source: 'route',
                  layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                  },
                  paint: {
                    'line-color': '#FFD700',
                    'line-width': 4,
                    'line-opacity': 0.8,
                    'line-dasharray': [2, 1]
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
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 p-4">
          <Card className="max-w-md w-full shadow-xl border-geo-blue/20 bg-slate-800 text-white">
            <CardHeader className="border-b border-slate-700 pb-3">
              <CardTitle className="text-xl text-geo-blue">Mapbox Token Required</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {mapError && (
                <div className="p-3 mb-4 bg-red-900/50 border border-red-700 text-red-200 rounded-md text-sm">
                  {mapError}
                </div>
              )}
              <p className="text-base text-slate-300 mb-6">
                Please enter your Mapbox public access token to display the map. You can get one by creating a free account at{' '}
                <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-geo-blue font-medium hover:underline">
                  mapbox.com
                </a>
              </p>
              <form onSubmit={handleTokenSubmit} className="space-y-4">
                <input
                  type="text"
                  name="mapboxToken"
                  placeholder="pk.eyJ1..."
                  defaultValue={mapboxToken !== DEFAULT_MAPBOX_TOKEN ? mapboxToken : ''}
                  className="w-full px-4 py-3 border border-slate-600 bg-slate-700 rounded-md text-base text-white"
                />
                <div className="flex flex-col space-y-3">
                  <Button type="submit" className="w-full py-5 text-base bg-geo-blue hover:bg-geo-blue/90">
                    Set Custom Token
                  </Button>
                  <Button type="button" variant="outline" onClick={handleResetToken} className="w-full py-5 text-base border-slate-600 text-slate-200">
                    Use Default Token
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div ref={mapContainer} className="absolute inset-0" />
          
          {/* Distance and time indicator (visible only in follow mode with location data) */}
          {followMode && locationData && distance && travelTime && (
            <div className="absolute top-4 z-10 left-1/2 transform -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full text-white font-medium text-base shadow-lg border border-white/20">
              <div className="flex items-center gap-3">
                <span>{Math.round(distance)} meters</span>
                <span className="w-1 h-1 bg-white rounded-full"></span>
                <span>{travelTime}</span>
              </div>
            </div>
          )}
          
          {!mapboxLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 bg-opacity-80 backdrop-blur-sm">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-geo-blue mx-auto"></div>
                <p className="mt-4 text-lg text-white">Loading map...</p>
              </div>
            </div>
          )}
          
          {mapError && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm">
              <Card className="max-w-md w-full shadow-xl border-red-700 bg-slate-800 text-white">
                <CardHeader className="border-b border-slate-700 pb-3">
                  <CardTitle className="text-xl text-red-500 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Map Error
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="mb-6 text-base text-slate-300">{mapError}</p>
                  <div className="flex space-x-3">
                    <Button 
                      onClick={() => setShowTokenInput(true)} 
                      className="flex-1 py-5 text-base bg-geo-blue hover:bg-geo-blue/90"
                    >
                      Change Token
                    </Button>
                    <Button 
                      onClick={() => window.location.reload()}
                      variant="outline"
                      className="flex-1 py-5 text-base border-slate-600 text-slate-200"
                    >
                      Reload Page
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div className="absolute bottom-4 right-4 z-10 flex gap-2">
            {onToggleFollowMode && locationData && (
              <Button 
                onClick={onToggleFollowMode} 
                variant={followMode ? "default" : "outline"}
                size="sm"
                className={followMode ? "bg-geo-blue hover:bg-geo-blue/90 text-base px-4 py-2" : "bg-black/70 hover:bg-black/80 shadow-md text-base px-4 py-2 text-white border-white/20"}
              >
                <Navigation className={followMode ? "animate-pulse mr-2" : "mr-2"} size={18} />
                {followMode ? "Following" : "Follow Device"}
              </Button>
            )}
            <Button 
              onClick={() => setShowTokenInput(true)} 
              variant="outline" 
              size="sm"
              className="bg-black/70 hover:bg-black/80 shadow-md text-base px-4 py-2 text-white border-white/20"
            >
              Change Map Token
            </Button>
          </div>
          
          <div className="absolute top-4 left-4 z-10 bg-black/70 p-3 rounded-md shadow-md text-white text-sm border border-white/20">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-3 h-3 rounded-full bg-blue-600 shadow-[0_0_5px_rgba(0,0,255,0.7)]"></div>
              <span>Current Device</span>
            </div>
            <div className="flex items-center gap-1 mb-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_5px_rgba(255,215,0,0.7)]"></div>
              <span>Path/Route</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_5px_rgba(255,0,0,0.7)]"></div>
              <span>Tracked Device</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TrackerMap;
