
import { Link } from "react-router-dom";
import { Github, Map, MapPin, Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-geo-blue/30 bg-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MapPin size={22} className="text-geo-blue" />
              <span className="text-xl font-bold text-geo-blue">Geo-Follower</span>
            </div>
            <p className="text-base text-muted-foreground">
              A simple, elegant solution for location tracking with privacy and security in mind.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold uppercase tracking-wider text-geo-blue">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-base text-muted-foreground hover:text-geo-blue transition-colors duration-200">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/create" className="text-base text-muted-foreground hover:text-geo-blue transition-colors duration-200">
                  Create Tracker
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold uppercase tracking-wider text-geo-blue">About</h3>
            <p className="text-base text-muted-foreground">
              Geo-Follower is a location tracking tool designed with simplicity and privacy in mind.
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <Shield size={18} className="text-geo-blue" />
              <span className="text-sm text-muted-foreground">Privacy Focused</span>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-geo-blue/20 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Geo-Follower. Developed by Emmanuel Khisa with love for KENYANS Gen-Z
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <Map size={18} className="text-geo-blue" />
            <span className="text-sm text-muted-foreground">Location tracking made simple</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
