
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Map, Navigation, MapPin, Share2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import TrackerManagement from "@/components/TrackerManagement";
import { restoreActiveTrackers, registerServiceWorker } from "@/utils/locationUtils";

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const Index = () => {
  useEffect(() => {
    // Register service worker and restore any active trackers
    registerServiceWorker().then(() => {
      // Initialize active trackers from previous sessions
      restoreActiveTrackers();
    });
  }, []);

  return (
    <div className="container mx-auto px-4 max-w-4xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold mb-4">Geo-Follower</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Real-time location tracking with background support
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button asChild size="lg" className="gap-2">
            <Link to="/create">
              <Navigation className="h-5 w-5" />
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
        <h2 className="text-2xl font-semibold mb-6">Your Saved Trackers</h2>
        <TrackerManagement />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-16"
      >
        <h2 className="text-2xl font-semibold mb-6">Features</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<Map className="h-8 w-8" />}
            title="Real-time Tracking"
            description="Track location in real-time with accurate GPS coordinates and accuracy information."
          />
          <FeatureCard 
            icon={<Zap className="h-8 w-8" />}
            title="Background Tracking"
            description="Keep tracking even when your browser is closed or the device is locked."
          />
          <FeatureCard 
            icon={<Share2 className="h-8 w-8" />}
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
        <p className="text-muted-foreground">
          Developed by Emmanuel Khisa
        </p>
      </motion.div>
    </div>
  );
};

export default Index;
