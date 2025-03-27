
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, LocateFixed, Bookmark, Navigation, ShieldAlert, Baby, Package } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { MapWebSocketService } from "@/utils/websocket";
import { 
  LocationData, 
  getFormattedDate, 
  getSavedTrackers
} from "@/utils/locationUtils";
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
  const [adMessage, setAdMessage] = useState<string>("");

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

    // Cycle through advertising messages
    const adMessages = [
      "Keep your children safe! Track their location in real-time.",
      "Worried about your teenager? Stay connected and ensure their safety.",
      "Protect your valuable devices from theft with real-time tracking.",
      "Going hiking? Share your location with loved ones for safety.",
      "Keeping Kenyans safe, one location at a time.",
    ];
    
    let currentAdIndex = 0;
    const adInterval = setInterval(() => {
      setAdMessage(adMessages[currentAdIndex]);
      currentAdIndex = (currentAdIndex + 1) % adMessages.length;
    }, 8000);
    
    // Set initial ad message
    setAdMessage(adMessages[0]);

    // Handle incoming location updates
    const handleLocationUpdate = (data: LocationData) => {
      setLocationData(data);
      
      toast({
        title: "Location Updated",
        description: "Received new location data",
        duration: 3000,
      });
    };

    const wsService = new MapWebSocketService(trackerId, handleLocationUpdate);

    const connectWebSocket = async () => {
      try {
        await wsService.connect();
        setIsConnected(true);
        
        toast({
          title: "Connected",
          description: "Connected to tracking server. Waiting for location updates.",
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

    // Clean up
    return () => {
      wsService.disconnect();
      clearInterval(adInterval);
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
      title: followMode ? "Follow Mode Disabled" : "Follow Mode Enabled",
      description: followMode 
        ? "You can now manually navigate the map" 
        : "Map will automatically follow device location",
      duration: 3000,
    });
  };

  const getAdIcon = () => {
    const adText = adMessage.toLowerCase();
    if (adText.includes("children") || adText.includes("kid")) {
      return <Baby className="h-5 w-5 text-geo-blue" />;
    } else if (adText.includes("device") || adText.includes("theft")) {
      return <Package className="h-5 w-5 text-geo-blue" />;
    } else {
      return <ShieldAlert className="h-5 w-5 text-geo-blue" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <Link 
          to="/create" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to tracker creation
        </Link>
        
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-geo-blue" />
          Location Tracker Map
        </h1>
        <p className="text-muted-foreground">
          {trackerName ? (
            <>
              <span className="font-medium">{trackerName}</span> <span className="font-mono text-xs">({trackerId})</span>
            </>
          ) : (
            <>Tracker ID: <span className="font-mono">{trackerId}</span></>
          )}
        </p>
      </div>
      
      {adMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <Alert variant="default" className="bg-geo-blue/5 border-geo-blue/20">
            <div className="flex items-center gap-2">
              {getAdIcon()}
              <AlertTitle className="text-geo-blue">{adMessage}</AlertTitle>
            </div>
            <AlertDescription className="pl-7 text-sm mt-1">
              Track your loved ones and valuable items in real-time with Geo-Follower
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
        <div className="lg:col-span-2 h-[60vh] lg:h-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="h-full relative"
          >
            <TrackerMap 
              locationData={locationData} 
              followMode={followMode}
              onToggleFollowMode={toggleFollowMode}
            />
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <Card className="w-full max-w-md border-destructive/50">
                  <CardHeader>
                    <CardTitle className="text-destructive">Connection Error</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">{error}</p>
                    <Button 
                      onClick={() => window.location.reload()}
                      className="w-full"
                    >
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {!locationData && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <div className="text-center">
                  <div className="relative mb-4 mx-auto">
                    <div className="h-16 w-16 rounded-full bg-geo-blue/20 flex items-center justify-center">
                      <MapPin className="h-8 w-8 text-geo-blue animate-pulse" />
                    </div>
                    <motion.div 
                      className="absolute inset-0 rounded-full border border-geo-blue"
                      animate={{ 
                        scale: [1, 1.5, 1], 
                        opacity: [1, 0, 1] 
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                    />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Waiting for location data...</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Make sure the tracking link is open on the device you want to track.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
        
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="shadow-md border-border/50">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LocateFixed className="h-5 w-5 text-geo-blue" />
                    Tracker Details
                  </div>
                  <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-300"}`} />
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="font-medium flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-300"}`} />
                      {isConnected ? "Connected" : "Connecting..."}
                    </div>
                  </div>
                  
                  {locationData ? (
                    <>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Last Update</div>
                        <div className="font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {getFormattedDate(locationData.timestamp)}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Coordinates</div>
                        <div className="font-mono text-sm bg-muted p-2 rounded">
                          {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Accuracy</div>
                        <div className="font-medium">
                          ±{locationData.accuracy.toFixed(1)} meters
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Follow Mode</div>
                        <Button
                          onClick={toggleFollowMode}
                          variant={followMode ? "default" : "outline"}
                          className={`w-full flex items-center gap-2 ${followMode ? "bg-geo-blue hover:bg-geo-blue/90" : ""}`}
                        >
                          <Navigation className={followMode ? "animate-pulse" : ""} size={16} />
                          {followMode ? "Following Device" : "Follow Device"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center">
                      <div className="animate-pulse text-center">
                        <MapPin className="h-10 w-10 text-geo-blue/50 mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Waiting for location data...
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Share the tracker link to receive location updates from the device.
                    </p>
                    
                    <div className="flex flex-col gap-2">
                      <Button 
                        asChild
                        variant="outline"
                        className="w-full"
                      >
                        <Link to={`/track/${trackerId}`}>
                          View Tracker Page
                        </Link>
                      </Button>
                      
                      <Button 
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => setShowManagement(!showManagement)}
                      >
                        <Bookmark className="h-4 w-4" />
                        {showManagement ? "Hide Saved Trackers" : "Manage Saved Trackers"}
                      </Button>
                      
                      <Button 
                        asChild
                        variant="ghost"
                        className="w-full"
                      >
                        <Link to="/create">
                          Create New Tracker
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {showManagement && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <TrackerManagement 
                currentTrackerId={trackerId} 
                onSelectTracker={handleSelectTracker}
              />
            </motion.div>
          )}
          
          <div className="text-center text-xs text-muted-foreground mt-4">
            <p>Geo-Follower - Developed by Emmanuel Khisa with love for KENYANS Gen-Z</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
