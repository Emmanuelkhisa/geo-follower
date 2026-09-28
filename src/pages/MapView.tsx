import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  LocateFixed, 
  Bookmark, 
  Navigation, 
  Share2, 
  Copy, 
  Check, 
  Radio, 
  Compass, 
  ExternalLink 
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { MapWebSocketService } from "@/utils/websocket";
import { 
  LocationData, 
  getFormattedDate, 
  getSavedTrackers
} from "@/utils/locationUtils";
import { copyTextToClipboard } from "@/utils/shareUtils";
import TrackerMap from "@/components/TrackerMap";
import TrackerManagement from "@/components/TrackerManagement";

const MapView = () => {
  const { trackerId } = useParams<{ trackerId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showManagement, setShowManagement] = useState(false);
  const [trackerName, setTrackerName] = useState<string | null>(null);
  const [followMode, setFollowMode] = useState(true);
  const [isCopiedTracker, setIsCopiedTracker] = useState(false);

  useEffect(() => {
    if (!trackerId) {
      setError("Invalid tracker ID");
      return;
    }

    // Check if this tracker is saved
    const savedTrackers = getSavedTrackers();
    const saved = savedTrackers.find(t => t.id === trackerId);
    if (saved) {
      setTrackerName(saved.name);
    }

    // Handle incoming location updates
    const handleLocationUpdate = (data: LocationData) => {
      setLocationData(data);
      
      toast({
        title: "Location Updated",
        description: `Coordinates received: ${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`,
        duration: 2500,
      });
    };

    const wsService = new MapWebSocketService(trackerId, handleLocationUpdate);

    const connectWebSocket = async () => {
      try {
        await wsService.connect();
        setIsConnected(true);
        
        toast({
          title: "Telemetry Stream Active",
          description: "Connected to tracking server. Waiting for position updates.",
        });
      } catch (err) {
        console.error("WebSocket connection error:", err);
        setError("Failed to connect to tracking server. Please verify your connection.");
        
        toast({
          title: "Connection Failed",
          description: "Could not connect to tracking server.",
          variant: "destructive",
        });
      }
    };

    connectWebSocket();

    return () => {
      wsService.disconnect();
    };
  }, [trackerId, toast]);

  const handleSelectTracker = (selectedTrackerId: string) => {
    if (selectedTrackerId !== trackerId) {
      navigate(`/map/${selectedTrackerId}`);
    }
  };

  const toggleFollowMode = () => {
    setFollowMode(prev => !prev);
    
    toast({
      title: followMode ? "Manual Navigation" : "Auto-Follow Enabled",
      description: followMode 
        ? "Free pan and zoom enabled" 
        : "Map will now track device movements",
      duration: 2000,
    });
  };

  const handleShareTrackerUrl = async () => {
    if (!trackerId) return;
    const trackerUrl = `${window.location.origin}/track/${trackerId}`;
    const success = await copyTextToClipboard(trackerUrl);

    if (success) {
      setIsCopiedTracker(true);
      toast({
        title: "Tracker URL copied",
        description: "Direct tracking link copied to clipboard. Send this to the device you wish to track.",
        duration: 3500,
      });
      setTimeout(() => setIsCopiedTracker(false), 2000);
    } else {
      toast({
        title: "Copy failed",
        description: "Could not copy link automatically. Please copy the URL from the input box.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link 
              to="/" 
              className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              All Trackers
            </Link>
            <span aria-hidden="true" className="text-slate-300">/</span>
            <span className="text-xs text-slate-500 font-mono">
              {trackerId}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Compass className="h-6 w-6 text-geo-blue" />
              {trackerName ? trackerName : "Live Map Telemetry"}
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700">
              <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              <span>{isConnected ? "Live Stream" : "Connecting"}</span>
            </div>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFollowMode}
            className={`h-9 text-xs gap-1.5 border-slate-300 ${followMode ? "border-geo-blue text-geo-blue bg-geo-blue/5" : ""}`}
            title="Keep map centered on incoming coordinates"
          >
            <Navigation className={`h-3.5 w-3.5 ${followMode ? "text-geo-blue animate-pulse" : ""}`} />
            <span>{followMode ? "Following" : "Free Pan"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShareTrackerUrl}
            className="h-9 text-xs font-medium border-geo-blue/40 text-geo-blue hover:bg-geo-blue/10 flex items-center gap-1.5"
            title="Copy tracker link to send to device"
          >
            {isCopiedTracker ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span>Share Link</span>
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Main Grid: Map & Telemetry Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
        {/* Left 2 Cols: Interactive Map Container */}
        <div className="lg:col-span-2 min-h-[500px] h-[65vh] lg:h-[72vh] rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm relative">
          <TrackerMap 
            locationData={locationData} 
            followMode={followMode}
            onToggleFollowMode={toggleFollowMode}
          />
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
              <Card className="w-full max-w-md border-destructive/40 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-destructive text-base">Connection Stream Error</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button 
                    onClick={() => window.location.reload()}
                    className="w-full h-9 text-xs"
                  >
                    Retry Connection
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          
          {!locationData && !error && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="bg-slate-900/80 backdrop-blur-md text-white px-5 py-4 rounded-xl shadow-xl max-w-xs text-center border border-slate-700 pointer-events-auto">
                <div className="h-10 w-10 rounded-full bg-geo-blue/20 text-geo-blue flex items-center justify-center mx-auto mb-2.5">
                  <Radio className="h-5 w-5 animate-pulse" />
                </div>
                <h3 className="text-sm font-semibold mb-1">Awaiting Telemetry</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  Open the tracking link on the target phone to stream live coordinates.
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full h-8 text-xs gap-1.5"
                  onClick={handleShareTrackerUrl}
                >
                  <Copy className="h-3 w-3" />
                  {isCopiedTracker ? "URL Copied!" : "Copy Transmitter Link"}
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Right Col: Telemetry Dashboard & Controls */}
        <div className="space-y-5">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="py-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <LocateFixed className="h-4 w-4 text-geo-blue" />
                Live Telemetry
              </CardTitle>
              <span className="text-[11px] text-muted-foreground font-mono">
                {locationData ? "SYNCED" : "LISTENING"}
              </span>
            </CardHeader>
            
            <CardContent className="p-5 space-y-4">
              {/* Coordinates Box */}
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1.5 flex items-center justify-between">
                  <span>Coordinates</span>
                  {locationData && (
                    <span className="text-[10px] text-emerald-600 font-medium">GPS Locked</span>
                  )}
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 font-mono text-xs text-slate-800 tabular-nums">
                  {locationData ? (
                    <div className="flex justify-between items-center">
                      <span>{locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">Waiting for GPS coordinate fix...</span>
                  )}
                </div>
              </div>

              {/* Accuracy & Timestamp Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5">
                  <div className="text-muted-foreground mb-1">Accuracy</div>
                  <div className="font-semibold text-slate-800 tabular-nums">
                    {locationData ? `±${locationData.accuracy.toFixed(1)} m` : "—"}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5">
                  <div className="text-muted-foreground mb-1">Signal Status</div>
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-amber-400"}`} />
                    {isConnected ? "Active" : "Connecting"}
                  </div>
                </div>
              </div>

              {locationData && (
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Last update: {getFormattedDate(locationData.timestamp)}</span>
                </div>
              )}

              {/* Tracker URL Sharing Box */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span className="font-medium">Device Transmitter Link</span>
                  <span>Open on target</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 font-mono text-xs bg-slate-50 p-2 rounded-md border border-slate-200 text-slate-700 truncate select-all">
                    {typeof window !== "undefined" && `${window.location.origin}/track/${trackerId}`}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 shrink-0 border-geo-blue/40 text-geo-blue hover:bg-geo-blue/10"
                    onClick={handleShareTrackerUrl}
                    title="Copy transmitter link"
                  >
                    {isCopiedTracker ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="pt-2 space-y-2">
                <Button 
                  asChild
                  className="w-full bg-geo-blue hover:bg-geo-blue/90 text-white text-xs h-9 font-medium"
                >
                  <Link to={`/track/${trackerId}`}>
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Open Transmitter on this Device
                  </Link>
                </Button>

                <Button 
                  variant="outline"
                  className="w-full text-xs h-9 border-slate-300"
                  onClick={() => setShowManagement(!showManagement)}
                >
                  <Bookmark className="h-3.5 w-3.5 mr-1.5 text-geo-blue" />
                  {showManagement ? "Hide Saved Trackers" : "Manage Saved Trackers"}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {showManagement && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <TrackerManagement 
                currentTrackerId={trackerId} 
                onSelectTracker={handleSelectTracker}
              />
            </motion.div>
          )}

          <div className="text-center text-xs text-muted-foreground pt-2">
            <p>Geo Follower · Live encrypted peer-to-peer location monitoring</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
