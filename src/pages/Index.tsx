import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Map, Navigation, MapPin, Share2, Zap, ArrowRight, Shield, Radio, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import TrackerManagement from "@/components/TrackerManagement";
import { restoreActiveTrackers, registerServiceWorker } from "@/utils/locationUtils";

const FeatureCard = ({ 
  icon, 
  title, 
  description,
  badge
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  badge: string;
}) => (
  <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="h-11 w-11 rounded-lg bg-geo-blue/10 flex items-center justify-center text-geo-blue">
          {icon}
        </div>
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
          {badge}
        </span>
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  </div>
);

const Index = () => {
  const [trackerInput, setTrackerInput] = useState("");
  const navigate = useNavigate();
  
  useEffect(() => {
    // Register service worker and restore any active trackers
    registerServiceWorker().then(() => {
      restoreActiveTrackers();
    });
  }, []);

  const handleOpenTracker = (e: React.FormEvent, mode: "map" | "track") => {
    e.preventDefault();
    if (!trackerInput.trim()) return;
    
    // Support either full URL (e.g. https://.../track/xyz or https://.../map/xyz) or plain ID
    let cleanedId = trackerInput.trim();
    if (cleanedId.includes("/")) {
      const parts = cleanedId.split("/").filter(Boolean);
      cleanedId = parts[parts.length - 1];
    }
    
    if (mode === "map") {
      navigate(`/map/${cleanedId}`);
    } else {
      navigate(`/track/${cleanedId}`);
    }
  };

  return (
    <div className="container mx-auto px-4 max-w-5xl py-4 space-y-12">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-3xl mx-auto pt-4"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600 mb-6">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
          <span>Real-time GPS telemetry</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>Zero cloud storage required</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
          Precision Real-Time Location Telemetry
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          Broadcast and monitor device coordinates with high-accuracy GPS, background service worker synchronization, and instant URL sharing.
        </p>

        {/* Quick Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto mb-4">
          {/* Card 1: Create New */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-geo-blue/50 transition-colors">
            <div>
              <div className="h-9 w-9 rounded-lg bg-geo-blue/10 flex items-center justify-center text-geo-blue mb-3">
                <Navigation className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 mb-1">Create New Tracker</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Generate a secure tracking link to send to a mobile phone or vehicle.
              </p>
            </div>
            <Button asChild className="w-full bg-geo-blue hover:bg-geo-blue/90 text-white gap-2 h-10 text-sm font-medium">
              <Link to="/create">
                Generate Tracking Link
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Card 2: Quick Lookup / Join */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-slate-400/50 transition-colors">
            <div>
              <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
                <Search className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 mb-1">Open Existing Tracker</h2>
              <p className="text-xs text-muted-foreground mb-3">
                Paste a tracker ID or link to monitor or transmit.
              </p>
            </div>
            <form onSubmit={(e) => handleOpenTracker(e, "map")} className="space-y-2">
              <Input
                placeholder="Enter Tracker ID or URL..."
                value={trackerInput}
                onChange={(e) => setTrackerInput(e.target.value)}
                className="h-9 text-xs font-mono"
              />
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  size="sm" 
                  variant="outline" 
                  disabled={!trackerInput.trim()}
                  className="flex-1 h-8 text-xs gap-1 border-slate-300"
                >
                  <Map className="h-3.5 w-3.5" />
                  View Map
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="secondary" 
                  disabled={!trackerInput.trim()}
                  onClick={(e) => handleOpenTracker(e, "track")}
                  className="flex-1 h-8 text-xs gap-1"
                >
                  <Radio className="h-3.5 w-3.5" />
                  Transmit
                </Button>
              </div>
            </form>
          </div>
        </div>
      </motion.section>
      
      {/* Saved Trackers Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="pt-4"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Saved Trackers</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Locally stored tracking sessions on this device
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-slate-300">
            <Link to="/create">
              <Navigation className="h-3.5 w-3.5 text-geo-blue" />
              New Session
            </Link>
          </Button>
        </div>
        <TrackerManagement />
      </motion.section>
      
      {/* Architecture & Features Grid */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="pt-6"
      >
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Telemetry Engine Capabilities</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Engineered for reliability, privacy, and low-latency continuous positioning.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <FeatureCard 
            icon={<MapPin className="h-5 w-5" />}
            title="Real-Time Position Stream"
            description="Continuously broadcasts device coordinates (latitude, longitude, accuracy, heading, and altitude) over WebSocket channels."
            badge="Telemetry"
          />
          <FeatureCard 
            icon={<Zap className="h-5 w-5" />}
            title="Background Synchronization"
            description="Leverages service workers to maintain periodic GPS polling even when the browser tab is minimised or the screen is locked."
            badge="Service Worker"
          />
          <FeatureCard 
            icon={<Share2 className="h-5 w-5" />}
            title="Instant URL Sharing"
            description="One-click clipboard copy with visual toast feedback. Anyone with the URL can monitor the device coordinates immediately."
            badge="Collaboration"
          />
        </div>
      </motion.section>
    </div>
  );
};

export default Index;
