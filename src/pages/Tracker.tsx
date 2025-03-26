
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Clock, AlertTriangle, Map, ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { 
  WebSocketService 
} from "@/utils/websocket";
import { 
  getCurrentPosition, 
  formatLocation, 
  getFormattedDate,
  registerServiceWorker,
  startBackgroundTracking,
  stopBackgroundTracking,
  SavedTracker,
  getSavedTrackers
} from "@/utils/locationUtils";
import TrackerManagement from "@/components/TrackerManagement";

const Tracker = () => {
  const { trackerId } = useParams<{ trackerId: string }>();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [isBackgroundTracking, setIsBackgroundTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [wsService, setWsService] = useState<WebSocketService | null>(null);
  const [savedTrackerInfo, setSavedTrackerInfo] = useState<SavedTracker | null>(null);
  const serviceWorkerRegistered = useRef(false);

  useEffect(() => {
    if (!trackerId) {
      setError("Invalid tracker ID");
      return;
    }

    // Check if this tracker is saved
    const savedTrackers = getSavedTrackers();
    const saved = savedTrackers.find(t => t.id === trackerId);
    if (saved) {
      setSavedTrackerInfo(saved);
    }

    // Setup service worker for background tracking
    const setupServiceWorker = async () => {
      const registration = await registerServiceWorker();
      if (registration) {
        serviceWorkerRegistered.current = true;
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          const { type, data } = event.data;
          
          if (type === 'LOCATION_UPDATE' && data) {
            // Update UI with location from service worker
            setCoordinates({
              lat: data.latitude,
              lng: data.longitude
            });
            setAccuracy(data.accuracy);
            setLastUpdate(getFormattedDate(data.timestamp));
          } else if (type === 'TRACKING_STARTED') {
            setIsBackgroundTracking(true);
            toast({
              title: "Background tracking active",
              description: "Location will be tracked even when browser is closed",
            });
          } else if (type === 'TRACKING_STOPPED') {
            setIsBackgroundTracking(false);
          }
        });
      }
    };

    setupServiceWorker();

    const ws = new WebSocketService(trackerId);
    setWsService(ws);

    const connectWebSocket = async () => {
      try {
        await ws.connect();
        setIsConnected(true);
        
        toast({
          title: "Connected",
          description: "Successfully connected to tracking server.",
        });
      } catch (error) {
        console.error("WebSocket connection error:", error);
        setError("Failed to connect to tracking server. Please try again.");
        
        toast({
          title: "Connection Failed",
          description: "Could not connect to tracking server. Check your network.",
          variant: "destructive",
        });
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.disconnect();
      }
      
      if (isBackgroundTracking) {
        // Don't stop background tracking when leaving page
        console.log("Keeping background tracking active after page close");
      } else {
        stopBackgroundTracking();
      }
    };
  }, [trackerId, toast]);

  const startTracking = useCallback(() => {
    if (!wsService || !trackerId) return () => {};

    setIsTracking(true);
    
    const trackLocation = async () => {
      try {
        setProgress(25);
        const position = await getCurrentPosition();
        setProgress(75);
        
        const locationData = formatLocation(position, trackerId);
        
        wsService.sendLocation(locationData);
        
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setAccuracy(position.coords.accuracy);
        setLastUpdate(getFormattedDate(position.timestamp));
        setProgress(100);
        
        setTimeout(() => setProgress(0), 1000);
      } catch (error) {
        console.error("Error getting location:", error);
        setError("Could not access location. Please ensure location services are enabled.");
        setIsTracking(false);
        
        toast({
          title: "Location Error",
          description: "Could not access your location. Please check your device settings.",
          variant: "destructive",
        });
      }
    };

    trackLocation();
    
    const intervalId = setInterval(trackLocation, 60000);
    
    return () => {
      clearInterval(intervalId);
      setIsTracking(false);
    };
  }, [wsService, trackerId, toast]);

  useEffect(() => {
    let cleanup = () => {};
    
    if (isConnected && !error) {
      cleanup = startTracking();
    }
    
    return cleanup;
  }, [isConnected, error, startTracking]);

  const toggleBackgroundTracking = () => {
    if (isBackgroundTracking) {
      stopBackgroundTracking();
      setIsBackgroundTracking(false);
      toast({
        title: "Background tracking stopped",
        description: "Location will only be tracked while this page is open",
      });
    } else if (trackerId) {
      startBackgroundTracking(trackerId);
      setIsBackgroundTracking(true);
      toast({
        title: "Background tracking started",
        description: "Location will be tracked even when browser is closed",
      });
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to home
        </Link>
        
        <h1 className="text-2xl font-bold">Location Tracker</h1>
        <p className="text-muted-foreground">
          {savedTrackerInfo ? (
            <>
              <span className="font-medium">{savedTrackerInfo.name}</span> <span className="font-mono text-xs">({trackerId})</span>
            </>
          ) : (
            <>Tracker ID: <span className="font-mono">{trackerId}</span></>
          )}
        </p>
      </motion.div>
      
      {error ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-destructive/50">
            <CardHeader className="bg-destructive/10 border-b border-destructive/20">
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4">{error}</p>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-md border-border/50 mb-6">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative h-6 w-6">
                    <MapPin className="h-6 w-6 text-geo-blue" />
                    {isTracking && (
                      <span className="absolute top-0 right-0 h-2 w-2 bg-green-500 rounded-full" />
                    )}
                  </div>
                  Location Tracker
                </div>
                
                <div className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Updates every minute
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-6 space-y-6">
              {progress > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Updating location...</div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              )}
              
              <div className="space-y-4">
                <StatusItem 
                  label="Status"
                  value={isTracking ? "Active" : "Connecting..."}
                  isActive={isTracking}
                />
                
                <StatusItem 
                  label="Last Update"
                  value={lastUpdate || "Waiting..."}
                  isActive={!!lastUpdate}
                />
                
                {coordinates && (
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Coordinates</div>
                    <div className="font-mono text-sm bg-muted p-2 rounded">
                      {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                    </div>
                  </div>
                )}
                
                {accuracy !== null && (
                  <StatusItem 
                    label="Accuracy"
                    value={`±${accuracy.toFixed(1)} meters`}
                    isActive={true}
                  />
                )}
                
                <StatusItem 
                  label="Background Tracking"
                  value={isBackgroundTracking ? "Enabled" : "Disabled"}
                  isActive={isBackgroundTracking}
                />
              </div>
              
              <div className="pt-2">
                <Button 
                  variant={isBackgroundTracking ? "destructive" : "default"}
                  className="w-full flex items-center justify-center gap-2 mb-4"
                  onClick={toggleBackgroundTracking}
                >
                  <Zap className="h-4 w-4" />
                  {isBackgroundTracking ? "Stop Background Tracking" : "Enable Background Tracking"}
                </Button>
                
                <p className="text-sm text-muted-foreground mb-4">
                  {isBackgroundTracking 
                    ? "Background tracking enabled. Location updates will continue even when browser is closed."
                    : "This page is now sending location updates. You can enable background tracking to continue after closing."
                  }
                </p>
                
                <Button 
                  asChild
                  variant="outline" 
                  className="w-full group"
                >
                  <Link to={`/map/${trackerId}`}>
                    <Map className="h-4 w-4 mr-2 group-hover:text-geo-blue transition-colors" />
                    View on Map
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <TrackerManagement 
            currentTrackerId={trackerId} 
          />

          <div className="text-center text-xs text-muted-foreground mt-12">
            <p>Geo-Follower - Developed by Emmanuel Khisa</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

interface StatusItemProps {
  label: string;
  value: string;
  isActive: boolean;
}

const StatusItem = ({ label, value, isActive }: StatusItemProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="flex items-center gap-1.5">
        <div className={`h-2 w-2 rounded-full ${isActive ? "bg-green-500" : "bg-gray-300"}`} />
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  );
};

export default Tracker;
