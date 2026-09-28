import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Clock, AlertTriangle, Map, ArrowLeft, Zap, Share2, Copy, Check, Radio, Signal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { WebSocketService } from "@/utils/websocket";
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
import { copyTextToClipboard } from "@/utils/shareUtils";
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
  const [isCopied, setIsCopied] = useState(false);
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
              description: "Location will be tracked even when browser is minimized",
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
          title: "Transmitter Connected",
          description: "WebSocket relay connection established.",
        });
      } catch (err) {
        console.error("WebSocket connection error:", err);
        setError("Failed to connect to tracking server. Please check your network.");
        
        toast({
          title: "Connection Failed",
          description: "Could not connect to tracking server.",
          variant: "destructive",
        });
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.disconnect();
      }
      
      if (!isBackgroundTracking) {
        stopBackgroundTracking();
      }
    };
  }, [trackerId, toast, isBackgroundTracking]);

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
      } catch (err) {
        console.error("Error getting location:", err);
        setError("Could not access device location. Please enable location permissions.");
        setIsTracking(false);
        
        toast({
          title: "Location Permission Required",
          description: "Please enable location services for this website.",
          variant: "destructive",
        });
      }
    };

    trackLocation();
    
    const intervalId = setInterval(trackLocation, 30000);
    
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
        title: "Background tracking paused",
        description: "Location will only be broadcast while this tab is focused.",
      });
    } else if (trackerId) {
      startBackgroundTracking(trackerId);
      setIsBackgroundTracking(true);
      toast({
        title: "Background tracking enabled",
        description: "Service worker will continue periodic broadcasting.",
      });
    }
  };

  const currentTrackerUrl = typeof window !== "undefined" && trackerId ? `${window.location.origin}/track/${trackerId}` : "";

  const handleShareTracker = async () => {
    if (!trackerId) return;
    const url = `${window.location.origin}/track/${trackerId}`;
    const success = await copyTextToClipboard(url);

    if (success) {
      setIsCopied(true);
      toast({
        title: "Tracker URL copied",
        description: "The tracker link has been copied to your clipboard.",
        duration: 3000,
      });
      setTimeout(() => setIsCopied(false), 2000);
    } else {
      toast({
        title: "Failed to copy",
        description: "Could not copy tracker URL. Please copy it manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-lg mx-auto py-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <Link 
            to="/" 
            className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to overview
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareTracker}
            className="h-8 text-xs font-medium border-geo-blue/30 text-geo-blue hover:bg-geo-blue/10 flex items-center gap-1.5"
            title="Copy tracker URL to clipboard"
          >
            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
            <span>{isCopied ? "Copied" : "Share Tracker"}</span>
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Location Transmitter</h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              {savedTrackerInfo ? `${savedTrackerInfo.name} · ${trackerId}` : `Session ID: ${trackerId}`}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 border border-slate-200">
            <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
            <span>{isConnected ? "Transmitting" : "Connecting"}</span>
          </div>
        </div>
      </motion.div>
      
      {error ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-destructive/40 shadow-sm">
            <CardHeader className="bg-destructive/10 border-b border-destructive/20 py-4">
              <CardTitle className="text-destructive text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Transmission Interrupted
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="w-full text-xs h-9"
              >
                Reconnect Transmitter
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="py-4 border-b border-slate-100">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <div className="relative flex h-7 w-7 items-center justify-center rounded-md bg-geo-blue/10 text-geo-blue">
                    <Radio className="h-4 w-4" />
                    {isTracking && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                  </div>
                  <span>Device Sensor Telemetry</span>
                </div>
                
                <div className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>30s interval</span>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-5 space-y-5">
              {progress > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-muted-foreground flex justify-between">
                    <span>Acquiring GPS fix...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1" />
                </div>
              )}
              
              <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
                <StatusItem 
                  label="Broadcast Channel"
                  value={isConnected ? "WebSocket Relay Online" : "Connecting..."}
                  isActive={isConnected}
                />
                
                <StatusItem 
                  label="GPS Sensor Status"
                  value={isTracking ? "Active & Streaming" : "Initializing..."}
                  isActive={isTracking}
                />
                
                <StatusItem 
                  label="Last Fix"
                  value={lastUpdate || "Acquiring..."}
                  isActive={!!lastUpdate}
                />
                
                {accuracy !== null && (
                  <StatusItem 
                    label="Accuracy Radius"
                    value={`±${accuracy.toFixed(1)} meters`}
                    isActive={true}
                  />
                )}
                
                <StatusItem 
                  label="Background Service Worker"
                  value={isBackgroundTracking ? "Persistent" : "Standard Tab"}
                  isActive={isBackgroundTracking}
                />
              </div>

              {coordinates && (
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1.5">Current GPS Coordinates</div>
                  <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-xs tabular-nums flex items-center justify-between">
                    <span>{coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}</span>
                    <span className="text-[10px] text-emerald-400 font-sans uppercase tracking-wider font-semibold">Locked</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-3 pt-1">
                <Button 
                  variant={isBackgroundTracking ? "secondary" : "outline"}
                  className="w-full h-9 text-xs flex items-center justify-center gap-2 border-slate-300"
                  onClick={toggleBackgroundTracking}
                >
                  <Zap className={`h-3.5 w-3.5 ${isBackgroundTracking ? "text-amber-500" : "text-slate-500"}`} />
                  {isBackgroundTracking ? "Disable Background Polling" : "Enable Background Service Worker"}
                </Button>

                {/* Share Tracker URL Section */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Share2 className="h-3 w-3 text-geo-blue" />
                      Tracking Link
                    </span>
                    <span className="text-[10px]">Share with observers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 font-mono text-xs bg-white p-2 rounded border border-slate-200 text-slate-700 truncate select-all">
                      {currentTrackerUrl}
                    </div>
                    <Button 
                      size="sm"
                      variant="outline"
                      className="h-8 px-2.5 shrink-0 border-geo-blue/40 text-geo-blue hover:bg-geo-blue/10"
                      onClick={handleShareTracker}
                      title="Copy tracker link"
                    >
                      {isCopied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button 
                    variant="outline" 
                    className="w-full text-xs h-9 border-slate-300 gap-1.5"
                    onClick={handleShareTracker}
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="h-3.5 w-3.5 text-geo-blue" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </Button>

                  <Button 
                    asChild
                    className="w-full bg-geo-blue hover:bg-geo-blue/90 text-white text-xs h-9 gap-1.5 font-medium"
                  >
                    <Link to={`/map/${trackerId}`}>
                      <Map className="h-3.5 w-3.5" />
                      Open Live Map
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <TrackerManagement 
            currentTrackerId={trackerId} 
          />

          <div className="text-center text-xs text-muted-foreground pt-4">
            <p>Geo Follower · Device GPS transmitter & telemetry stream</p>
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
    <div className="flex items-center justify-between text-xs">
      <div className="text-muted-foreground">{label}</div>
      <div className="flex items-center gap-1.5">
        <div className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
        <span className="font-medium text-slate-800 tabular-nums">{value}</span>
      </div>
    </div>
  );
};

export default Tracker;
