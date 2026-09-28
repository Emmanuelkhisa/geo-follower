import { useEffect, useRef, useState } from 'react';
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
  Crosshair
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

interface GoogleMapProps {
  locationData: LocationData | null;
  followMode?: boolean;
  onToggleFollowMode?: () => void;
}

const GoogleMap = ({ locationData, followMode = false, onToggleFollowMode }: GoogleMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const trackedMarker = useRef<google.maps.Marker | null>(null);
  const accuracyCircle = useRef<google.maps.Circle | null>(null);
  const polylineTrail = useRef<google.maps.Polyline | null>(null);
  const infoWindow = useRef<google.maps.InfoWindow | null>(null);
  const inspectMarker = useRef<google.maps.Marker | null>(null);
  const inspectInfoWindow = useRef<google.maps.InfoWindow | null>(null);
  const locationRef = useRef<LocationData | null>(null);
  const trailPath = useRef<google.maps.LatLngLiteral[]>([]);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [address, setAddress] = useState<string>('Resolving location...');
  const [isTelemetryExpanded, setIsTelemetryExpanded] = useState<boolean>(true);
  
  const envGoogleKey = (
    (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
    (import.meta.env.VITE_GOOGLE_MAPS_KEY as string) ||
    (import.meta.env.VITE_MAPS_API_KEY as string) ||
    ''
  );
  
  const [apiKey, setApiKey] = useState<string>(
    localStorage.getItem('google_maps_key') || envGoogleKey
  );
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [mapType, setMapType] = useState('roadmap');
  const initialLoadRef = useRef(true);

  // Fetch address on location change
  useEffect(() => {
    if (!locationData) return;
    let isMounted = true;
    fetchAddress(locationData.latitude, locationData.longitude).then(addr => {
      if (isMounted) setAddress(addr);
    });
    return () => { isMounted = false; };
  }, [locationData]);

  // Dynamically load Google Maps API
  useEffect(() => {
    window.gm_authFailure = () => {
      console.warn('Google Maps API authentication failed.');
      setMapError('Google Maps API Key Error. Maps JavaScript API is not enabled or key is invalid.');
      setShowKeyInput(true);
      setGoogleMapsLoaded(false);
    };

    if (window.google && window.google.maps && apiKey) {
      setGoogleMapsLoaded(true);
      return;
    }

    if (!apiKey) {
      setMapError('No Google Maps API key provided. You can provide one or use the Free OpenStreetMap provider.');
      setShowKeyInput(true);
      return;
    }

    let googleMapsScript = document.getElementById('google-maps-script') as HTMLScriptElement | null;
    if (googleMapsScript) {
      if (googleMapsScript.src.includes(`key=${encodeURIComponent(apiKey)}`)) {
        if (window.google && window.google.maps) {
          setGoogleMapsLoaded(true);
        }
        return;
      } else {
        googleMapsScript.remove();
      }
    }

    googleMapsScript = document.createElement('script');
    googleMapsScript.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    googleMapsScript.async = true;
    googleMapsScript.defer = true;
    googleMapsScript.id = 'google-maps-script';
    
    googleMapsScript.addEventListener('load', () => {
      setGoogleMapsLoaded(true);
      setMapError(null);
    });

    googleMapsScript.addEventListener('error', () => {
      setMapError('Failed to load Google Maps script. Check your API key and connection.');
      setShowKeyInput(true);
    });

    document.head.appendChild(googleMapsScript);
  }, [apiKey]);

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

  // Initialize Map
  useEffect(() => {
    if (!googleMapsLoaded || !mapContainer.current || !window.google || !window.google.maps) return;

    const initialCenter = locationData 
      ? { lat: locationData.latitude, lng: locationData.longitude }
      : { lat: -1.2921, lng: 36.8219 };

    try {
      const mapOptions: google.maps.MapOptions = {
        center: initialCenter,
        zoom: locationData ? 16 : 12,
        mapTypeId: mapType as google.maps.MapTypeId,
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        zoomControl: true,
        styles: mapType === 'roadmap' ? [
          { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
          { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] }
        ] : []
      };

      map.current = new window.google.maps.Map(mapContainer.current, mapOptions);

      // Create click-to-inspect listener
      map.current.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng || !map.current) return;
        const clickedLat = e.latLng.lat();
        const clickedLng = e.latLng.lng();
        
        let distText = '';
        if (locationRef.current) {
          const d = calculateDistance(locationRef.current.latitude, locationRef.current.longitude, clickedLat, clickedLng);
          distText = d > 1000 ? `${(d/1000).toFixed(2)} km` : `${Math.round(d)} m`;
        }

        if (!inspectMarker.current) {
          inspectMarker.current = new google.maps.Marker({
            position: { lat: clickedLat, lng: clickedLng },
            map: map.current,
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 5,
              fillColor: '#38bdf8',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }
          });
        } else {
          inspectMarker.current.setPosition({ lat: clickedLat, lng: clickedLng });
          inspectMarker.current.setMap(map.current);
        }

        if (!inspectInfoWindow.current) {
          inspectInfoWindow.current = new google.maps.InfoWindow();
        }

        inspectInfoWindow.current.setContent(`
          <div style="color:#0f172a; font-family:sans-serif; padding:4px;">
            <div style="font-weight:bold; color:#0284c7; margin-bottom:2px;">📌 Selected Point</div>
            <div><b>Lat:</b> ${clickedLat.toFixed(6)}°</div>
            <div><b>Lng:</b> ${clickedLng.toFixed(6)}°</div>
            ${distText ? `<div style="margin-top:4px; font-weight:bold; color:#059669;">📏 Distance: ${distText} from device</div>` : ''}
          </div>
        `);
        inspectInfoWindow.current.open(map.current, inspectMarker.current);
      });

      // Marker for tracked location
      trackedMarker.current = new window.google.maps.Marker({
        position: initialCenter,
        map: map.current,
        title: 'Tracked Device',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        zIndex: 1000
      });

      // Accuracy circle
      accuracyCircle.current = new window.google.maps.Circle({
        strokeColor: '#ef4444',
        strokeOpacity: 0.8,
        strokeWeight: 1.5,
        fillColor: '#ef4444',
        fillOpacity: 0.15,
        map: map.current,
        center: initialCenter,
        radius: locationData ? locationData.accuracy : 15,
      });

      // Polyline trail
      polylineTrail.current = new window.google.maps.Polyline({
        path: trailPath.current,
        geodesic: true,
        strokeColor: '#38bdf8',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: map.current
      });

      // InfoWindow
      infoWindow.current = new window.google.maps.InfoWindow({
        content: `
          <div style="color: #0f172a; padding: 4px; font-family: sans-serif;">
            <h4 style="font-weight: bold; margin: 0 0 4px 0; color: #ef4444;">📍 Tracked Device</h4>
            <p style="margin: 0; font-size: 12px;">Waiting for location...</p>
          </div>
        `
      });

      trackedMarker.current.addListener('click', () => {
        if (infoWindow.current && map.current && trackedMarker.current) {
          infoWindow.current.open(map.current, trackedMarker.current);
        }
      });

      setMapLoaded(true);
    } catch (e) {
      console.error('Error initializing Google Map:', e);
      setMapError('Error initializing Google Map. Check console for details.');
    }

    return () => {
      if (trackedMarker.current) trackedMarker.current.setMap(null);
      if (accuracyCircle.current) accuracyCircle.current.setMap(null);
      if (polylineTrail.current) polylineTrail.current.setMap(null);
      if (inspectMarker.current) inspectMarker.current.setMap(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleMapsLoaded, mapType]);

  // Update marker and circle on location changes
  const updateMarkerAndCircle = (data: LocationData) => {
    if (!map.current || !trackedMarker.current || !accuracyCircle.current || !polylineTrail.current) return;

    locationRef.current = data;
    const newPos = { lat: data.latitude, lng: data.longitude };

    trackedMarker.current.setPosition(newPos);
    accuracyCircle.current.setCenter(newPos);
    accuracyCircle.current.setRadius(data.accuracy);

    trailPath.current.push(newPos);
    polylineTrail.current.setPath(trailPath.current);

    if (infoWindow.current) {
      infoWindow.current.setContent(`
        <div style="color: #0f172a; padding: 6px; font-family: sans-serif;">
          <h4 style="font-weight: bold; margin: 0 0 4px 0; color: #ef4444;">📍 Tracked Device</h4>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #475569;">${address}</p>
          <div style="font-size: 11px; line-height: 1.4;">
            <div><b>Lat:</b> ${data.latitude.toFixed(6)}°</div>
            <div><b>Lng:</b> ${data.longitude.toFixed(6)}°</div>
            <div><b>Accuracy:</b> ±${data.accuracy.toFixed(1)}m</div>
          </div>
        </div>
      `);
    }

    if (followMode || initialLoadRef.current) {
      map.current.panTo(newPos);
      if (initialLoadRef.current) {
        map.current.setZoom(16);
        initialLoadRef.current = false;
      }
    }
  };

  useEffect(() => {
    if (!mapLoaded || !locationData) return;
    updateMarkerAndCircle(locationData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, locationData, followMode]);

  const handleMapTypeChange = (value: string) => {
    setMapType(value);
    if (map.current) {
      map.current.setMapTypeId(value as google.maps.MapTypeId);
    }
  };

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const keyInput = form.elements.namedItem('googleKey') as HTMLInputElement;
    if (keyInput && keyInput.value) {
      const newKey = keyInput.value.trim();
      localStorage.setItem('google_maps_key', newKey);
      setApiKey(newKey);
      setShowKeyInput(false);
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
    <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950">
      <div ref={mapContainer} className="w-full h-full min-h-[400px]" />

      {/* Floating Map Controls (Top Right) */}
      {mapLoaded && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 pointer-events-auto">
          <Select value={mapType} onValueChange={handleMapTypeChange}>
            <SelectTrigger className="w-[120px] bg-slate-900/90 border-slate-700 text-white text-xs h-9 rounded-xl backdrop-blur-md">
              <SelectValue placeholder="Map Style" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-white">
              <SelectItem value="roadmap">Roadmap</SelectItem>
              <SelectItem value="satellite">Satellite</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="terrain">Terrain</SelectItem>
            </SelectContent>
          </Select>

          {locationData && (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => {
                if (map.current && locationData) {
                  map.current.panTo({ lat: locationData.latitude, lng: locationData.longitude });
                  map.current.setZoom(16);
                }
              }}
              title="Recenter Map"
              className="h-9 w-9 bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700 rounded-xl"
            >
              <Crosshair className="h-4 w-4 text-emerald-400" />
            </Button>
          )}
        </div>
      )}

      {/* Floating Rich Telemetry Overlay Card */}
      {locationData && mapLoaded && (
        <div className="absolute top-4 left-4 z-10 max-w-xs md:max-w-sm pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur-xl p-3 rounded-2xl border border-slate-700/70 shadow-2xl text-white space-y-2 pointer-events-auto">
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="font-semibold text-xs text-slate-200 uppercase tracking-wider">Google Maps Live</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] bg-geo-blue/20 text-geo-blue px-2 py-0.5 rounded-full font-mono">
                  {trailPath.current.length} Pings
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
      
      {!googleMapsLoaded && !mapError && !showKeyInput && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm pointer-events-none">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-geo-blue mx-auto"></div>
            <p className="mt-4 text-base text-white">Loading Google Maps...</p>
          </div>
        </div>
      )}
      
      {(mapError || showKeyInput) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4">
          <Card className="max-w-md w-full shadow-2xl border-geo-blue/30 bg-slate-800 text-white rounded-2xl">
            <CardHeader className="border-b border-slate-700 pb-3">
              <CardTitle className="text-lg text-geo-blue flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                Google Maps API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <p className="text-sm text-slate-300">
                {mapError || 'Google Maps requires an API key. You can provide a key below or switch to Free OpenStreetMap instantly.'}
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
                <span className="bg-slate-800 px-3 text-xs text-slate-400 uppercase tracking-wider">or enter key</span>
              </div>

              <form onSubmit={handleKeySubmit} className="space-y-3">
                <input
                  type="text"
                  name="googleKey"
                  placeholder="Enter Google Maps API Key (AIzaSy...)"
                  defaultValue={apiKey}
                  className="w-full px-4 py-2.5 border border-slate-600 bg-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-geo-blue"
                />
                <Button type="submit" variant="secondary" className="w-full py-2.5 rounded-xl cursor-pointer">
                  Save & Load Google Maps
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

export default GoogleMap;
