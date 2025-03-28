
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Navigation, Map } from "lucide-react";

const Header = () => {
  return (
    <header className="border-b border-geo-blue/30 bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-geo-blue text-white">
              <MapPin size={24} className="group-hover:scale-110 transition-transform duration-300" />
              <motion.div 
                className="absolute inset-0 rounded-full border-2 border-geo-blue"
                animate={{ 
                  scale: [1, 1.2, 1], 
                  opacity: [1, 0.5, 0] 
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              />
            </div>
            <div>
              <span className="text-2xl font-bold text-geo-blue block">Geo-Follower</span>
              <span className="text-xs text-gray-500">WHERE ARE YOU?</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-10">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/create">Create Tracker</NavLink>
            <div className="px-3 py-1 rounded bg-geo-blue/10 text-geo-blue font-medium flex items-center">
              <Map size={16} className="mr-1" />
              <span>Dual Map Support</span>
            </div>
          </nav>
          
          <div className="md:hidden">
            {/* Mobile menu would go here */}
          </div>
        </div>
      </div>
    </header>
  );
};

const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  return (
    <Link 
      to={to} 
      className="relative text-foreground/80 hover:text-geo-blue transition-colors duration-200 py-2 text-lg font-medium"
    >
      {children}
      <motion.div 
        className="absolute bottom-0 left-0 w-0 h-0.5 bg-geo-blue"
        whileHover={{ width: '100%' }}
        transition={{ duration: 0.3 }}
      />
    </Link>
  );
};

export default Header;
