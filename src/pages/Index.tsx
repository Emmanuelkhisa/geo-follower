
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Map, Navigation, MapPin, Share2, Zap, ShieldAlert, Baby, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import TrackerManagement from "@/components/TrackerManagement";
import { restoreActiveTrackers, registerServiceWorker } from "@/utils/locationUtils";

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <Card className="border border-geo-blue/20 shadow-md hover:shadow-lg transition-all duration-300">
    <CardContent className="pt-6">
      <div className="mb-4 text-geo-blue">{icon}</div>
      <h3 className="text-xl font-medium mb-3">{title}</h3>
      <p className="text-muted-foreground text-base">{description}</p>
    </CardContent>
  </Card>
);

const Index = () => {
  const [adMessage, setAdMessage] = useState<string>("");
  
  useEffect(() => {
    // Register service worker and restore any active trackers
    registerServiceWorker().then(() => {
      // Initialize active trackers from previous sessions
      restoreActiveTrackers();
    });
    
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
    
    return () => clearInterval(adInterval);
  }, []);
  
  const getAdIcon = () => {
    const adText = adMessage.toLowerCase();
    if (adText.includes("children") || adText.includes("teenager")) {
      return <Baby className="h-6 w-6 text-geo-blue" />;
    } else if (adText.includes("device") || adText.includes("theft")) {
      return <Package className="h-6 w-6 text-geo-blue" />;
    } else {
      return <ShieldAlert className="h-6 w-6 text-geo-blue" />;
    }
  };

  return (
    <div className="container mx-auto px-4 max-w-4xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-bold mb-4 text-geo-blue">Geo-Follower</h1>
        <p className="text-2xl text-muted-foreground mb-8">
          Real-time location tracking with background support
        </p>
        
        {adMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Alert variant="default" className="bg-geo-blue/5 border-geo-blue/20 shadow-md">
              <div className="flex items-center gap-2">
                {getAdIcon()}
                <AlertTitle className="text-geo-blue text-xl">{adMessage}</AlertTitle>
              </div>
              <AlertDescription className="pl-8 text-base mt-1">
                Track your loved ones and valuable items in real-time with Geo-Follower
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button asChild size="lg" className="gap-2 bg-geo-blue hover:bg-geo-blue/90 text-xl py-7 px-8">
            <Link to="/create">
              <Navigation className="h-6 w-6" />
              Create New Tracker
            </Link>
          </Button>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-3xl font-semibold mb-6 text-geo-blue">Your Saved Trackers</h2>
        <TrackerManagement />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-16"
      >
        <h2 className="text-3xl font-semibold mb-8 text-geo-blue">Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Map className="h-10 w-10" />}
            title="Real-time Tracking"
            description="Track location in real-time with accurate GPS coordinates and accuracy information."
          />
          <FeatureCard 
            icon={<Zap className="h-10 w-10" />}
            title="Background Tracking"
            description="Keep tracking even when your browser is closed or the device is locked."
          />
          <FeatureCard 
            icon={<Share2 className="h-10 w-10" />}
            title="Easy Sharing"
            description="Share your location tracker with anyone using a simple link."
          />
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-16 text-center pb-8"
      >
        <p className="text-muted-foreground text-lg">
          Developed by Emmanuel Khisa with love for KENYANS 
        </p>
      </motion.div>
    </div>
  );
};

export default Index;
