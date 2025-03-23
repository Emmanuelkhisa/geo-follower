
import { Link } from "react-router-dom";
import { Github, Map, MapPin, Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/40 bg-background/80 backdrop-blur-md py-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MapPin size={20} className="text-geo-blue" />
              <span className="text-lg font-semibold">Geo Man</span>
            </div>
            <p className="text-sm text-muted-foreground">
              A simple, elegant solution for location tracking with privacy and security in mind.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/create" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                  Create Tracker
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider">About</h3>
            <p className="text-sm text-muted-foreground">
              Geo Man is a location tracking tool designed with simplicity and privacy in mind.
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <Shield size={16} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Privacy Focused</span>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-border/40 flex flex-col md:flex-row items-center justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Geo Man. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <Map size={16} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Location tracking made simple</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
