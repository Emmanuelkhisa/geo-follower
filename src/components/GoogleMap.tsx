
import { useEffect, useRef, useState } from 'react';
import { LocationData } from '@/utils/locationUtils';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateDistance, calculateTravelTime } from '@/utils/mapUtils';

interface GoogleMapProps {
  locationData: LocationData | null;
  followMode?: boolean;
  onToggleFollowMode?: () => void;
}

const GoogleMap = ({ locationData, followMode = false, onToggleFollowMode }: GoogleMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const trackedMarker = useRef<google.maps.Marker | null>(null);
  const currentMarker = useRef<google.maps.Marker | null>(null);
  const routeLine = useRef<google.maps.Polyline | null>(null);
  const accuracyCircle = useRef<google.maps.Circle | null>(null);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [googleApiKey, setGoogleApiKey] = useState<string>(localStorage.getItem('google_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem('google_api_key'));
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapType, setMapType] = useState('roadmap');
  const [distance, setDistance] = useState<number | null>(null);
  const [travelTime, setTravelTime] = useState<string | null>(null);

  // Dynamically load Google Maps API
  useEffect(() => {
    if (!googleApiKey) return;
    
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setGoogleMapsLoaded(true);
        return;
      }

      // Create script element to load Google Maps API
      const googleMapsScript = document.createElement('script');
      googleMapsScript.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places`;
      googleMapsScript.async = true;
      googleMapsScript.defer = true;
      googleMapsScript.id = 'google-maps-script';
      
      googleMapsScript.addEventListener('load', () => {
        setGoogleMapsLoaded(true);
      });
      
      googleMapsScript.addEventListener('error', () => {
        setMapError('Failed to load Google Maps. Please check your API key.');
        setShowKeyInput(true);
      });
      
      document.head.appendChild(googleMapsScript);
      
      return () => {
        // Cleanup script on unmount
        const script = document.getElementById('google-maps-script');
        if (script) {
          document.head.removeChild(script);
        }
      };
    };

    loadGoogleMaps();
  }, [googleApiKey]);

  // Initialize map after Google Maps API is loaded
  useEffect(() => {
    if (!googleMapsLoaded || !mapContainer.current) return;
    
    try {
      const mapOptions: google.maps.MapOptions = {
        center: locationData 
          ? { lat: locationData.latitude, lng: locationData.longitude } 
          : { lat: 1.2921, lng: 36.8219 }, // Default to Nairobi
        zoom: locationData ? 15 : 12,
        mapTypeId: mapType as google.maps.MapTypeId,
        streetViewControl: true,
        fullscreenControl: false,
        mapTypeControl: false,
        zoomControl: true,
        styles: [
          {
            "elementType": "geometry",
            "stylers": [{ "color": "#212121" }]
          },
          {
            "elementType": "labels.text.stroke",
            "stylers": [{ "color": "#212121" }]
          },
          {
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#757575" }]
          },
          {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [{ "color": "#424242" }]
          },
          {
            "featureType": "road",
            "elementType": "geometry.stroke",
            "stylers": [{ "color": "#212121" }]
          },
          {
            "featureType": "poi",
            "elementType": "geometry",
            "stylers": [{ "color": "#323232" }]
          },
          {
            "featureType": "poi.park",
            "elementType": "geometry",
            "stylers": [{ "color": "#1E3300" }]
          },
          {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{ "color": "#09152C" }]
          }
        ]
      };

      map.current = new google.maps.Map(mapContainer.current, mapOptions);
      setMapLoaded(true);
      setMapError(null);
      
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      setMapError('Failed to initialize Google Maps. Please check your browser compatibility.');
    }
    
    return () => {
      // Clean up markers and other Google Maps objects
      if (trackedMarker.current) trackedMarker.current.setMap(null);
      if (currentMarker.current) currentMarker.current.setMap(null);
      if (routeLine.current) routeLine.current.setMap(null);
      if (accuracyCircle.current) accuracyCircle.current.setMap(null);
    };
  }, [googleMapsLoaded, locationData, mapType]);

  // Update marker when location data changes
  useEffect(() => {
    if (!mapLoaded || !locationData || !map.current) return;

    try {
      const trackedPosition = { 
        lat: locationData.latitude, 
        lng: locationData.longitude 
      };
      
      // Create tracked device marker (RED)
      if (!trackedMarker.current) {
        trackedMarker.current = new google.maps.Marker({
          position: trackedPosition,
          map: map.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#FF0000',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          },
          zIndex: 2,
          title: 'Tracked Device'
        });
      } else {
        trackedMarker.current.setPosition(trackedPosition);
      }
      
      // Add accuracy circle
      if (!accuracyCircle.current) {
        accuracyCircle.current = new google.maps.Circle({
          map: map.current,
          center: trackedPosition,
          radius: locationData.accuracy,
          strokeColor: '#FFD700',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#FFD700',
          fillOpacity: 0.25,
          zIndex: 1
        });
      } else {
        accuracyCircle.current.setCenter(trackedPosition);
        accuracyCircle.current.setRadius(locationData.accuracy);
      }
      
      // Add a "current location" marker (BLUE)
      // This is a simulated current device location for demonstration
      const currentLocationOffset = 0.001; // Small offset for demonstration
      const currentPosition = {
        lat: locationData.latitude + currentLocationOffset,
        lng: locationData.longitude + currentLocationOffset
      };
      
      if (!currentMarker.current) {
        currentMarker.current = new google.maps.Marker({
          position: currentPosition,
          map: map.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#0000FF',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          },
          zIndex: 2,
          title: 'Current Device'
        });
      } else {
        currentMarker.current.setPosition(currentPosition);
      }
      
      // Add line between current and tracked location
      const routePath = [
        currentPosition,
        trackedPosition
      ];
      
      if (!routeLine.current) {
        routeLine.current = new google.maps.Polyline({
          path: routePath,
          geodesic: true,
          strokeColor: '#FFD700',
          strokeOpacity: 0.8,
          strokeWeight: 4,
          map: map.current,
          zIndex: 1
        });
      } else {
        routeLine.current.setPath(routePath);
      }
      
      // Calculate distance and travel time
      const distanceInMeters = calculateDistance(
        currentPosition.lat, 
        currentPosition.lng,
        trackedPosition.lat,
        trackedPosition.lng
      );
      
      setDistance(distanceInMeters);
      setTravelTime(calculateTravelTime(distanceInMeters));
      
      // Fly to the location with animation if in follow mode
      if (followMode) {
        map.current.panTo(trackedPosition);
      }
    } catch (error) {
      console.error('Error updating Google Maps markers:', error);
    }
  }, [mapLoaded, locationData, followMode]);

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem('googleApiKey') as HTMLInputElement;
    
    if (input.value.trim()) {
      setGoogleApiKey(input.value.trim());
      setShowKeyInput(false);
      setMapError(null);
      
      // Store token in localStorage for future use
      localStorage.setItem('google_api_key', input.value.trim());
    }
  };

  const handleMapTypeChange = (value: string) => {
    setMapType(value);
    if (map.current) {
      map.current.setMapTypeId(value as google.maps.MapTypeId);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden shadow-lg">
      {showKeyInput ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 p-4">
          <Card className="max-w-md w-full shadow-xl border-geo-blue/20 bg-slate-800 text-white">
            <CardHeader className="border-b border-slate-700 pb-3">
              <CardTitle className="text-xl text-geo-blue">Google Maps API Key Required</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {mapError && (
                <div className="p-3 mb-4 bg-red-900/50 border border-red-700 text-red-200 rounded-md text-sm">
                  {mapError}
                </div>
              )}
              <p className="text-base text-slate-300 mb-6">
                Please enter your Google Maps API key. You can get one from the{' '}
                <a href="https://console.cloud.google.com/google/maps-apis" target="_blank" rel="noopener noreferrer" className="text-geo-blue font-medium hover:underline">
                  Google Cloud Console
                </a>
              </p>
              <form onSubmit={handleKeySubmit} className="space-y-4">
                <input
                  type="text"
                  name="googleApiKey"
                  placeholder="AIzaSyD..."
                  defaultValue={googleApiKey || ''}
                  className="w-full px-4 py-3 border border-slate-600 bg-slate-700 rounded-md text-base text-white"
                />
                <Button type="submit" className="w-full py-5 text-base bg-geo-blue hover:bg-geo-blue/90">
                  Set API Key
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div ref={mapContainer} className="absolute inset-0" />
          
          {/* Distance and time indicator */}
          {followMode && locationData && distance && travelTime && (
            <div className="absolute top-4 z-10 left-1/2 transform -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full text-white font-medium text-base shadow-lg border border-white/20">
              <div className="flex items-center gap-3">
                <span>{Math.round(distance)} meters</span>
                <span className="w-1 h-1 bg-white rounded-full"></span>
                <span>{travelTime}</span>
              </div>
            </div>
          )}
          
          {/* Map type selector */}
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10">
            <Select value={mapType} onValueChange={handleMapTypeChange}>
              <SelectTrigger className="w-40 bg-black/70 border border-white/20 text-white">
                <SelectValue placeholder="Map Type" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border border-white/20 text-white">
                <SelectItem value="roadmap">Road Map</SelectItem>
                <SelectItem value="terrain">Terrain</SelectItem>
                <SelectItem value="satellite">Satellite</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {!googleMapsLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 bg-opacity-80 backdrop-blur-sm">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-geo-blue mx-auto"></div>
                <p className="mt-4 text-lg text-white">Loading Google Maps...</p>
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
                      onClick={() => setShowKeyInput(true)} 
                      className="flex-1 py-5 text-base bg-geo-blue hover:bg-geo-blue/90"
                    >
                      Change API Key
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
              onClick={() => setShowKeyInput(true)} 
              variant="outline" 
              size="sm"
              className="bg-black/70 hover:bg-black/80 shadow-md text-base px-4 py-2 text-white border-white/20"
            >
              Change API Key
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

export default GoogleMap;
