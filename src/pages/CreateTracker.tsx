
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Copy, Check, MapPin, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { generateTrackerId } from "@/utils/locationUtils";

const CreateTracker = () => {
  const { toast } = useToast();
  const [trackerId, setTrackerId] = useState(generateTrackerId());
  const [copying, setCopying] = useState(false);
  const [generatingNew, setGeneratingNew] = useState(false);
  
  const baseUrl = window.location.origin;
  const trackerUrl = `${baseUrl}/track/${trackerId}`;
  const mapUrl = `${baseUrl}/map/${trackerId}`;
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(trackerUrl);
      setCopying(true);
      
      toast({
        title: "Link copied",
        description: "Tracker link has been copied to clipboard.",
      });
      
      setTimeout(() => setCopying(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the link. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleGenerateNewId = () => {
    setGeneratingNew(true);
    
    // Add a small delay for animation
    setTimeout(() => {
      const newId = generateTrackerId();
      setTrackerId(newId);
      setGeneratingNew(false);
      
      toast({
        title: "New tracker created",
        description: "A new tracking ID has been generated.",
      });
    }, 600);
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-3xl font-bold mb-4">Create Location Tracker</h1>
        <p className="text-muted-foreground">
          Generate a unique tracking link that can be shared to monitor a device's location.
        </p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-geo-blue" />
              Your Tracking Link
            </CardTitle>
            <CardDescription>
              Share this link with the device you want to track. When opened, it will begin sending location updates.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted rounded-lg overflow-hidden relative">
              <div className="font-mono text-sm break-all">{trackerUrl}</div>
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 h-8 w-8"
                onClick={handleCopyLink}
              >
                {copying ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">Tracking ID:</div>
              <div className="flex items-center">
                <div className="bg-geo-blue/10 text-geo-blue px-3 py-1 rounded-md font-mono text-sm mr-2">
                  {trackerId}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-2"
                  onClick={handleGenerateNewId}
                  disabled={generatingNew}
                >
                  {generatingNew ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  New ID
                </Button>
              </div>
            </div>
            
            <div className="rounded-lg border border-border p-4 bg-muted/50">
              <div className="flex gap-4 items-start">
                <div className="bg-geo-blue/20 text-geo-blue rounded-full p-2">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">View on Map</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Use this link to view the tracked location on a map:
                  </p>
                  <div className="font-mono text-xs break-all bg-background p-2 rounded">
                    {mapUrl}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              For the terminal client, run the provided Node.js server and it will receive location updates automatically.
            </p>
            
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCopyLink}
              >
                {copying ? (
                  <>
                    <Check className="h-4 w-4 mr-2" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" /> Copy Link
                  </>
                )}
              </Button>
              
              <Button asChild className="flex-1 gap-2">
                <Link to={`/map/${trackerId}`}>
                  View Map <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8 bg-muted p-4 rounded-lg border border-border/50"
      >
        <h3 className="font-medium mb-2 flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-geo-blue/20 flex items-center justify-center">
            <span className="text-geo-blue text-xs">i</span>
          </div>
          Terminal Tracking Client
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          To receive location updates in your terminal, you'll need to run the WebSocket server included in the project.
        </p>
        <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-xs overflow-x-auto">
          <p>
            # 1. Navigate to the server directory<br />
            cd src/server<br /><br />
            
            # 2. Install WebSocket dependency (if not already installed)<br />
            npm install ws<br /><br />
            
            # 3. Run the server<br />
            node server.js
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateTracker;
