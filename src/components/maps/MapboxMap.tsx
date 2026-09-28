import { useEffect, useRef, useState } from 'react';
import type mapboxglType from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { LocationData, fetchAddress, getCardinalDirection, getFormattedDate } from '@/utils/locationUtils';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Navigation, 
  Compass, 
  Gauge, 
  Mountain, 
  ExternalLink, 
  MapPin, 
  Globe, 
  ChevronUp, 
  ChevronDown, 
  Crosshair,
  Maximize2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Default to empty; use a token from env/localStorage when available.
const DEFAULT_MAPBOX_TOKEN = "";

interface MapboxMapProps {
  locationData: LocationData | null;
  followMode?: boolean;
  onToggleFollowMode?: () => void;
}

const MapboxMap = ({ locationData, followMode = false, onToggleFollowMode }: MapboxMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxglType.Map | null>(null);
  const marker = useRef<mapboxglType.Marker | null>(null);
  const popupRef = useRef<mapboxglType.Popup | null>(null);
  const inspectMarker = useRef<mapboxglType.Marker | null>(null);
  const inspectPopup = useRef<mapboxglType.Popup | null>(null);
  const trailCoordinatesRef = useRef<Array<[number, number]>>([]);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);
  const [address, setAddress] = useState<string>('Resolving location...');
  const [isTelemetryExpanded, setIsTelemetryExpanded] = useState<boolean>(true);
  
  const envMapboxToken = (
    (import.meta.env.VITE_MAPBOX_TOKEN as string) ||
    (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string) ||
    ''
  );

  const [mapboxToken, setMapboxToken] = useState<string>(
    localStorage.getItem('mapbox_token') || envMapboxToken || DEFAULT_MAPBOX_TOKEN
  );
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapboxglRef = useRef<typeof mapboxglType | null>(null);
  const initialLoadRef = useRef(true);
  const locationRef = useRef<LocationData | null>(null);

  // Fetch address whenever location changes
  useEffect(() => {
    if (!locationData) return;
    let isMounted = true;
    fetchAddress(locationData.latitude, locationData.longitude).then(res => {
      if (isMounted) setAddress(res);
    });
    return () => { isMounted = false; };
  }, [locationData]);

  // Calculate distance in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
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

  // Dynamically import mapbox-gl
  useEffect(() => {
    if (!mapboxToken) {
      setMapError("Mapbox token is missing. You can provide one or use the Free OpenStreetMap provider.");
      setShowTokenInput(true);
      return;
    }
    
    let isMounted = true;

    const loadMapbox = async () => {
      try {
        const mapboxModule = await import('mapbox-gl').catch(error => {
          console.error('Failed to import mapbox-gl:', error);
          if (isMounted) setMapError('Failed to load map library.');
          return null;
        });
        
        if (!mapboxModule || !isMounted) return;
        
        const mapboxgl = mapboxModule.default;
        mapboxglRef.current = mapboxgl;
        
        mapboxgl.accessToken = mapboxToken;
        setMapboxLoaded(true);
        
        if (!mapContainer.current) return;
        
        try {
          map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/navigation-night-v1',
            center: locationData ? [locationData.longitude, locationData.latitude] : [36.8219, -1.2921],
            zoom: locationData ? 15 : 12,
            pitch: 45,
            attributionControl: false,
            antialias: true
          });

          map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

          map.current.on('style.load', () => {
            if (!map.current || !isMounted) return;

            // Add 3D buildings layer
            const layers = map.current.getStyle().layers;
            let labelLayerId;
            if (layers) {
              for (let i = 0; i < layers.length; i++) {
                if (layers[i].type === 'symbol' && layers[i].layout && layers[i].layout['text-field']) {
                  labelLayerId = layers[i].id;
                  break;
                }
              }
            }

            if (!map.current.getLayer('3d-buildings')) {
              map.current.addLayer(
                {
                  id: '3d-buildings',
                  source: 'composite',
                  'source-layer': 'building',
                  filter: ['==', 'extrude', 'true'],
                  type: 'fill-extrusion',
                  minzoom: 14,
                  paint: {
                    'fill-extrusion-color': '#0f172a',
                    'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 15.05, ['get', 'height']],
                    'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 14, 0, 15.05, ['get', 'min_height']],
                    'fill-extrusion-opacity': 0.7
                  }
                },
                labelLayerId
              );
            }

            // Accuracy source & layers
            if (!map.current.getSource('accuracy-source')) {
              map.current.addSource('accuracy-source', {
                type: 'geojson',
                data: {
                  type: 'FeatureCollection',
                  features: []
                }
              });

              map.current.addLayer({
                id: 'accuracy-fill',
                type: 'fill',
                source: 'accuracy-source',
                paint: {
                  'fill-color': '#ef4444',
                  'fill-opacity': 0.12
                }
              });

              map.current.addLayer({
                id: 'accuracy-stroke',
                type: 'line',
                source: 'accuracy-source',
                paint: {
                  'line-color': '#ef4444',
                  'line-width': 1.5,
                  'line-opacity': 0.8
                }
              });
            }

            // Trail source & layer
            if (!map.current.getSource('trail-source')) {
              map.current.addSource('trail-source', {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: trailCoordinatesRef.current
                  }
                }
              });

              map.current.addLayer({
                id: 'trail-line',
                type: 'line',
                source: 'trail-source',
                paint: {
                  'line-color': '#38bdf8',
                  'line-width': 4,
                  'line-opacity': 0.85,
                  'line-dasharray': [2, 1]
                }
              });
            }

            setMapLoaded(true);
            setMapError(null);
          });

          // Click / Tap listener on map to inspect coordinates & measure distance
          map.current.on('click', (e) => {
            if (!map.current || !mapboxglRef.current) return;
            const clickedLng = e.lngLat.lng;
            const clickedLat = e.lngLat.lat;

            let distText = '';
            if (locationRef.current) {
              const d = calculateDistance(locationRef.current.latitude, locationRef.current.longitude, clickedLat, clickedLng);
              distText = d > 1000 ? `${(d/1000).toFixed(2)} km` : `${Math.round(d)} m`;
            }

            if (!inspectPopup.current) {
              inspectPopup.current = new mapboxglRef.current.Popup({ closeButton: true, offset: 15 });
            }

            inspectPopup.current
              .setLngLat([clickedLng, clickedLat])
              .setHTML(`
                <div style="background:#0f172a; color:#f8fafc; padding:4px; font-family:sans-serif; border-radius:8px;">
                  <div style="font-weight:bold; color:#38bdf8; margin-bottom:2px;">📌 Selected Point</div>
                  <div><b>Lat:</b> ${clickedLat.toFixed(6)}°</div>
                  <div><b>Lng:</b> ${clickedLng.toFixed(6)}°</div>
                  ${distText ? `<div style="margin-top:4px; font-weight:bold; color:#34d399;">📏 Distance: ${distText} from device</div>` : ''}
                </div>
              `)
              .addTo(map.current);
          });

          map.current.on('error', (e) => {
            console.error('Mapbox error event:', e);
            if (e.error && (e.error.status === 401 || e.error.message?.includes('token') || e.error.message?.includes('Forbidden'))) {
              if (isMounted) {
                setMapError('Invalid Mapbox access token or unauthorized domain.');
                setShowTokenInput(true);
              }
            }
          });

        } catch (initError: unknown) {
          console.error('Error creating Mapbox map instance:', initError);
          if (isMounted) {
            setMapError('Could not initialize Mapbox 3D graphics.');
            setShowTokenInput(true);
          }
        }
      } catch (err: unknown) {
        console.error('Error in Mapbox loading flow:', err);
        if (isMounted) {
          setMapError('Failed to load Mapbox resources.');
          setShowTokenInput(true);
        }
      }
    };

    loadMapbox();

    return () => {
      isMounted = false;
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxToken]);

  // Update marker, trail, and accuracy on location updates
  const updateMarkerAndAccuracy = (data: LocationData) => {
    if (!map.current || !mapboxglRef.current || !mapLoaded) return;

    locationRef.current = data;
    const mapboxgl = mapboxglRef.current;
    const coords: [number, number] = [data.longitude, data.latitude];

    // Marker creation or update
    if (!marker.current) {
      const el = document.createElement('div');
      el.className = 'custom-mapbox-marker';
      el.innerHTML = `
        <div style="position:relative; width:32px; height:32px;">
          <div style="position:absolute; width:32px; height:32px; border-radius:50%; border:3px solid #ef4444; animation:ping 1.8s infinite;"></div>
          <div style="position:absolute; top:6px; left:6px; width:20px; height:20px; background:#ef4444; border:2px solid #ffffff; border-radius:50%; box-shadow:0 0 10px rgba(239,68,68,0.9);"></div>
        </div>
      `;

      popupRef.current = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div style="color:#0f172a; padding:4px; font-family:sans-serif;">
            <b style="color:#ef4444;">📍 Tracked Device</b><br/>
            Lat: ${data.latitude.toFixed(6)}°<br/>
            Lng: ${data.longitude.toFixed(6)}°<br/>
            Accuracy: ±${data.accuracy.toFixed(1)}m
          </div>
        `);

      marker.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(coords)
        .setPopup(popupRef.current)
        .addTo(map.current);
    } else {
      marker.current.setLngLat(coords);
    }

    // Add trail coordinate
    const lastCoord = trailCoordinatesRef.current[trailCoordinatesRef.current.length - 1];
    if (!lastCoord || lastCoord[0] !== coords[0] || lastCoord[1] !== coords[1]) {
      trailCoordinatesRef.current.push(coords);
      const trailSource = map.current.getSource('trail-source') as mapboxglType.GeoJSONSource;
      if (trailSource) {
        trailSource.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: trailCoordinatesRef.current
          }
        });
      }
    }

    // Follow mode pan
    if (followMode || initialLoadRef.current) {
      map.current.easeTo({
        center: coords,
        zoom: 16,
        duration: 1000
      });
      initialLoadRef.current = false;
    }
  };

  useEffect(() => {
    if (!mapLoaded || !locationData) return;
    updateMarkerAndAccuracy(locationData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, locationData, followMode]);

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const tokenInput = form.elements.namedItem('mapboxToken') as HTMLInputElement;
    if (tokenInput && tokenInput.value) {
      const newToken = tokenInput.value.trim();
      localStorage.setItem('mapbox_token', newToken);
      setMapboxToken(newToken);
      setShowTokenInput(false);
      setMapError(null);
    }
  };

  const switchToOpenStreetMap = () => {
    localStorage.setItem('map_provider', 'iframe');
    window.location.reload();
  };

  const speedKmh = locationData?.speed ? (locationData.speed * 3.6).toFixed(1) : '0.0';
  const altitudeM = locationData?.altitude ? Math.round(locationData.altitude) : null;
  const headingStr = getCardinalDirection(locationData?.heading);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950"
    >
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Floating Action Controls (Top Right) */}
      {mapLoaded && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 pointer-events-auto">
          {locationData && (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => {
                if (map.current && locationData) {
                  map.current.flyTo({
                    center: [locationData.longitude, locationData.latitude],
                    zoom: 16,
                    essential: true
                  });
                }
              }}
              title="Recenter Map"
              className="h-9 w-9 bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700 rounded-xl"
            >
              <Crosshair className="h-4 w-4 text-sky-400" />
            </Button>
          )}
        </div>
      )}

      {/* Floating Rich Telemetry Overlay Card */}
      {locationData && mapboxLoaded && (
        <div className="absolute top-4 left-4 z-10 max-w-xs md:max-w-sm pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur-xl p-3 rounded-2xl border border-slate-700/70 shadow-2xl text-white space-y-2 pointer-events-auto">
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                </span>
                <span className="font-semibold text-xs text-slate-200 uppercase tracking-wider">Mapbox 3D Live</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full font-mono">
                  {trailCoordinatesRef.current.length} Pings
                </span>
                <button
                  type="button"
                  onClick={() => setIsTelemetryExpanded(!isTelemetryExpanded)}
                  className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
                >
                  {isTelemetryExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-0.5">
              <MapPin className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 font-medium leading-snug line-clamp-2" title={address}>
                {address}
              </div>
            </div>

            {isTelemetryExpanded && (
              <>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 bg-slate-800/80 p-2 rounded-xl border border-slate-700/50">
                    <Gauge className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-sans">Speed</div>
                      <div className="font-bold text-white">{speedKmh} <span className="text-[10px] font-normal">km/h</span></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-800/80 p-2 rounded-xl border border-slate-700/50">
                    <Mountain className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-sans">Altitude</div>
                      <div className="font-bold text-white">{altitudeM !== null ? `${altitudeM} m` : 'N/A'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-800/80 p-2 rounded-xl border border-slate-700/50">
                    <Compass className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-sans">Heading</div>
                      <div className="font-bold text-white truncate">{headingStr}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-800/80 p-2 rounded-xl border border-slate-700/50">
                    <div className="h-3.5 w-3.5 rounded-full border border-rose-400 flex items-center justify-center text-[9px] text-rose-400 font-bold shrink-0">±</div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-sans">Accuracy</div>
                      <div className="font-bold text-white">±{locationData.accuracy.toFixed(1)} <span className="text-[10px] font-normal">m</span></div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-[11px] text-slate-400">
                  <span>Lat: {locationData.latitude.toFixed(5)}°, Lng: {locationData.longitude.toFixed(5)}°</span>
                  <a
                    href={`https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-geo-blue hover:underline flex items-center gap-1 font-sans font-medium"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {!mapboxLoaded && !mapError && !showTokenInput && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm pointer-events-none">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-geo-blue mx-auto"></div>
            <p className="mt-4 text-base text-white">Loading Mapbox 3D...</p>
          </div>
        </div>
      )}
      
      {(mapError || showTokenInput) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4">
          <Card className="max-w-md w-full shadow-2xl border-sky-500/30 bg-slate-800 text-white rounded-2xl">
            <CardHeader className="border-b border-slate-700 pb-3">
              <CardTitle className="text-lg text-sky-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                Mapbox 3D Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <p className="text-sm text-slate-300">
                {mapError || 'Mapbox requires an access token. You can switch to Free OpenStreetMap with 1-click or provide a custom Mapbox token.'}
              </p>

              <Button 
                type="button" 
                onClick={switchToOpenStreetMap}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                <Globe className="h-4 w-4" />
                Switch to Free OpenStreetMap (No Key Needed)
              </Button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-700 w-full"></div>
                <span className="bg-slate-800 px-3 text-xs text-slate-400 uppercase tracking-wider">or enter token</span>
              </div>

              <form onSubmit={handleTokenSubmit} className="space-y-3">
                <input
                  type="text"
                  name="mapboxToken"
                  placeholder="Enter Mapbox Token (pk.eyJ1...)"
                  defaultValue={mapboxToken !== DEFAULT_MAPBOX_TOKEN ? mapboxToken : ''}
                  className="w-full px-4 py-2.5 border border-slate-600 bg-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-sky-400"
                />
                <Button type="submit" variant="secondary" className="w-full py-2.5 rounded-xl cursor-pointer">
                  Save & Load Mapbox
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      
      <div className="absolute bottom-4 right-4 z-10 pointer-events-auto">
        {onToggleFollowMode && locationData && (
          <Button 
            onClick={onToggleFollowMode} 
            variant={followMode ? "default" : "outline"}
            size="sm"
            className={followMode ? "bg-geo-blue hover:bg-geo-blue/90 text-sm px-4 py-2 shadow-xl rounded-xl font-medium" : "bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700 text-sm px-4 py-2 shadow-xl rounded-xl font-medium"}
          >
            <Navigation className={followMode ? "animate-pulse mr-2" : "mr-2"} size={16} />
            {followMode ? "Following Device" : "Follow Device"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default MapboxMap;
