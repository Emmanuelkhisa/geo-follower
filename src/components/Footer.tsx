
import { Link } from "react-router-dom";
import { Map, MapPin, Shield, Radio, Navigation } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-slate-200/80 bg-white/80 backdrop-blur-sm py-10 mt-auto">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-lg bg-geo-blue/10 flex items-center justify-center text-geo-blue">
                <MapPin size={18} />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">Geo Follower</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              High-accuracy real-time location telemetry and live mapping. Secure device-to-device tracking with background service worker synchronization.
            </p>
            <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Shield size={14} className="text-geo-blue" />
                Zero-Knowledge Privacy
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Radio size={14} className="text-emerald-500" />
                Live WebSocket Relay
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-geo-blue transition-colors">
                  Overview & Saved Trackers
                </Link>
              </li>
              <li>
                <Link to="/create" className="text-muted-foreground hover:text-geo-blue transition-colors">
                  Create New Tracker
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Telemetry Engine</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Navigation size={13} className="text-geo-blue" />
                <span>HTML5 Geolocation API</span>
              </li>
              <li className="flex items-center gap-2">
                <Map size={13} className="text-geo-blue" />
                <span>Dual Mapbox & OSM Support</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Geo Follower. Real-time location telemetry.
          </p>
          <div className="flex items-center gap-3">
            <span>Client-side encryption enabled</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Local persistence</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
