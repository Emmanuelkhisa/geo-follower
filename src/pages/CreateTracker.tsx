import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Copy, Check, MapPin, RefreshCw, ArrowRight, Radio, Save, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { generateTrackerId, saveTracker } from "@/utils/locationUtils";
import { copyTextToClipboard } from "@/utils/shareUtils";

const CreateTracker = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [trackerId, setTrackerId] = useState(generateTrackerId());
  const [trackerName, setTrackerName] = useState("");
  const [copying, setCopying] = useState(false);
  const [generatingNew, setGeneratingNew] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const trackerUrl = `${baseUrl}/track/${trackerId}`;
  const mapUrl = `${baseUrl}/map/${trackerId}`;
  
  const handleCopyLink = async () => {
    const success = await copyTextToClipboard(trackerUrl);
    if (success) {
      setCopying(true);
      
      toast({
        title: "Tracker link copied",
        description: "Direct tracking link has been copied to your clipboard.",
      });
      
      setTimeout(() => setCopying(false), 2000);
    } else {
      toast({
        title: "Failed to copy",
        description: "Could not copy the link automatically.",
        variant: "destructive",
      });
    }
  };
  
  const handleGenerateNewId = () => {
    setGeneratingNew(true);
    setIsSaved(false);
    
    setTimeout(() => {
      const newId = generateTrackerId();
      setTrackerId(newId);
      setGeneratingNew(false);
      
      toast({
        title: "New session generated",
        description: "A fresh tracking ID has been created.",
      });
    }, 400);
  };

  const handleSaveToLocal = () => {
    const nameToSave = trackerName.trim() || `Tracker ${trackerId.substring(0, 6)}`;
    saveTracker({
      id: trackerId,
      name: nameToSave,
      isTracking: false,
    });
    setIsSaved(true);
    toast({
      title: "Session Saved",
      description: `Saved as "${nameToSave}" in your local tracker list.`,
    });
  };
  
  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Create New Tracker</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Generate a secure tracking link. Send it to any mobile browser to stream real-time GPS coordinates.
        </p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-geo-blue" />
                <span>Generated Tracking Session</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5 border-slate-300"
                onClick={handleGenerateNewId}
                disabled={generatingNew}
              >
                <RefreshCw className={`h-3 w-3 ${generatingNew ? "animate-spin text-geo-blue" : ""}`} />
                Generate New ID
              </Button>
            </CardTitle>
            <CardDescription className="text-xs">
              This unique URL will transmit location telemetry to your map viewer once opened.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6 space-y-5">
            {/* Direct Tracker URL Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">Transmitter URL</span>
                <span className="text-muted-foreground">Send to target device</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2">
                <div className="font-mono text-xs text-slate-800 break-all select-all flex-1">
                  {trackerUrl}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 shrink-0 border-geo-blue/40 text-geo-blue hover:bg-geo-blue/10 gap-1.5 text-xs font-medium"
                  onClick={handleCopyLink}
                >
                  {copying ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Tracker ID & Custom Label */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Unique Tracking ID</label>
                <div className="h-9 px-3 bg-slate-100 rounded-md font-mono text-xs flex items-center text-slate-800 border border-slate-200">
                  {trackerId}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Custom Label (Optional)</label>
                <div className="flex gap-2">
                  <Input 
                    value={trackerName}
                    onChange={(e) => {
                      setTrackerName(e.target.value);
                      setIsSaved(false);
                    }}
                    placeholder="e.g. Work Van, Personal Phone"
                    className="h-9 text-xs"
                  />
                  <Button
                    size="sm"
                    variant={isSaved ? "secondary" : "outline"}
                    className="h-9 text-xs shrink-0 border-slate-300 gap-1"
                    onClick={handleSaveToLocal}
                  >
                    {isSaved ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Save className="h-3.5 w-3.5" />}
                    <span>{isSaved ? "Saved" : "Save"}</span>
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Monitor Map URL Card */}
            <div className="rounded-lg border border-slate-200/90 p-4 bg-slate-50/70">
              <div className="flex gap-3 items-start">
                <div className="h-8 w-8 rounded-lg bg-geo-blue/10 text-geo-blue flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-semibold text-slate-900 mb-0.5">Observer Map Link</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    Open this URL on your computer or monitor phone to observe the target in real time:
                  </p>
                  <div className="font-mono text-xs text-slate-700 bg-white p-2 rounded border border-slate-200 truncate select-all">
                    {mapUrl}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="p-6 pt-0 flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 h-10 text-xs border-slate-300 gap-2"
              onClick={handleCopyLink}
            >
              {copying ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copying ? "Link Copied!" : "Copy Transmitter Link"}
            </Button>
            
            <Button asChild className="flex-1 h-10 text-xs bg-geo-blue hover:bg-geo-blue/90 text-white gap-2 font-medium">
              <Link to={`/map/${trackerId}`}>
                Open Observer Map
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
      
      {/* Terminal and Node instructions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="h-4 w-4 text-geo-blue" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Real-Time Relay Server
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          Geo Follower relays peer updates through a low-latency WebSocket service. For multi-device network testing across LAN:
        </p>
        <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-xs space-y-1">
          <div className="text-slate-400"># Start local WebSocket relay:</div>
          <div className="text-emerald-400">node src/server/server.js</div>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateTracker;
