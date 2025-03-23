
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { MapPin, Navigation, ArrowRight, Shield, Eye, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* Hero section */}
      <section className="relative py-20 overflow-hidden">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="md:w-1/2 space-y-6 max-w-lg">
              <motion.span 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-block px-3 py-1 text-xs font-semibold tracking-wider text-geo-blue bg-geo-blue/10 rounded-full"
              >
                REAL-TIME LOCATION TRACKING
              </motion.span>
              
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl md:text-5xl font-bold tracking-tight"
              >
                Simple Location Tracking with <span className="text-geo-blue">Geo Man</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-muted-foreground"
              >
                Create tracking links, monitor real-time location updates, and visualize movements on a beautiful map interface.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button asChild size="lg" className="gap-2 group">
                  <Link to="/create">
                    Create Tracking Link
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </motion.div>
            </div>
            
            <div className="md:w-1/2 relative min-h-[400px]">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="absolute inset-0 glassmorphism rounded-2xl overflow-hidden shadow-2xl"
                style={{ 
                  transformStyle: 'preserve-3d',
                  transform: `perspective(1000px) rotateY(${scrollY * 0.02}deg) rotateX(${scrollY * -0.01}deg)`
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <div className="w-full h-full bg-white/40 dark:bg-black/40 rounded-xl overflow-hidden shadow-inner relative">
                    <div className="absolute inset-0 bg-geo-gray rounded-xl">
                      <div className="absolute top-6 left-6 flex items-center space-x-2">
                        <div className="w-10 h-10 bg-geo-blue rounded-full flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-lg font-semibold">Location Tracker</div>
                      </div>
                      
                      <div className="absolute top-24 inset-x-6">
                        <div className="h-48 rounded-lg bg-white/70 dark:bg-gray-800/70 shadow-lg relative overflow-hidden">
                          <div className="absolute inset-0 bg-map-pattern bg-cover opacity-20"></div>
                          
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="relative">
                              <div className="w-8 h-8 bg-geo-blue rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 bg-white rounded-full"></div>
                              </div>
                              <div className="absolute inset-0 rounded-full bg-geo-blue/30 animate-ping-slow"></div>
                            </div>
                          </div>
                          
                          <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 py-1 px-3 rounded-full text-xs font-semibold shadow flex items-center space-x-1">
                            <Navigation className="h-3 w-3" />
                            <span>34.0522° N, 118.2437° W</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="absolute bottom-6 inset-x-6 space-y-3">
                        <div className="h-14 rounded-lg bg-white/70 dark:bg-gray-800/70 shadow-sm flex items-center px-4">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">Active Tracking</div>
                            <div className="text-xs text-gray-500">Last update: Just now</div>
                          </div>
                          <Clock className="h-4 w-4 text-gray-400" />
                        </div>
                        
                        <div className="h-10 rounded-lg bg-geo-blue text-white flex items-center justify-center font-medium">
                          View on Map
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features section */}
      <section className="py-16">
        <div className="container px-4 mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">Key Features</h2>
            <p className="text-muted-foreground text-lg">
              Simple, powerful location tracking with privacy and security in mind.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<MapPin className="h-6 w-6" />}
              title="Real-time Tracking"
              description="Monitor location updates in real-time with high accuracy and minimal battery impact."
            />
            
            <FeatureCard 
              icon={<Eye className="h-6 w-6" />}
              title="Live Map View"
              description="Visualize the tracked location on an interactive, beautiful map interface."
            />
            
            <FeatureCard 
              icon={<Shield className="h-6 w-6" />}
              title="Privacy Focused"
              description="Your data stays private with unique tracking IDs and encrypted connections."
            />
          </div>
        </div>
      </section>
      
      {/* CTA section */}
      <section className="py-16">
        <div className="container px-4 mx-auto">
          <div className="bg-gradient-to-r from-geo-blue/10 to-geo-lightBlue/10 rounded-2xl p-8 md:p-12 shadow-sm">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Ready to start tracking?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Create a tracking link in seconds and start monitoring locations with just a few clicks.
              </p>
              
              <Button asChild size="lg" className="gap-2 group">
                <Link to="/create">
                  Create Tracking Link
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <motion.div 
      whileHover={{ y: -5, transition: { duration: 0.3 } }}
      className="bg-background rounded-xl p-6 shadow-sm border border-border/50 transition-shadow duration-300 hover:shadow-md"
    >
      <div className="w-12 h-12 bg-geo-blue/10 rounded-full flex items-center justify-center text-geo-blue mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  );
};

export default Index;
