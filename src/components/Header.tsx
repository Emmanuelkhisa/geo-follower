
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

const Header = () => {
  return (
    <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-geo-blue text-white">
              <MapPin size={20} className="group-hover:scale-110 transition-transform duration-300" />
              <motion.div 
                className="absolute inset-0 rounded-full border border-geo-blue"
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
            <span className="text-xl font-semibold text-foreground">Geo Man</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/create">Create Tracker</NavLink>
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
      className="relative text-foreground/80 hover:text-foreground transition-colors duration-200 py-2"
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
