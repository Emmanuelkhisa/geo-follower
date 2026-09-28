
import { Globe, Layers, MapPin, Sparkles } from "lucide-react";

export type MapProviderType = 'iframe' | 'mapbox' | 'google';

interface MapProviderSelectorProps {
  provider: MapProviderType;
  onProviderChange: (provider: MapProviderType) => void;
}

const MapProviderSelector = ({ provider, onProviderChange }: MapProviderSelectorProps) => {
  return (
    <div className="bg-slate-900/90 p-1.5 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-xl flex flex-wrap items-center gap-1">
      <button
        type="button"
        id="provider-osm-btn"
        onClick={() => onProviderChange('iframe')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
          provider === 'iframe'
            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
        }`}
        title="Free Live OpenStreetMap with Dark, Satellite & Terrain views. No API key needed!"
      >
        <Globe className={`h-3.5 w-3.5 ${provider === 'iframe' ? 'text-white' : 'text-emerald-400'}`} />
        <span>OpenStreetMap</span>
        <span className={`text-[10px] px-1.5 py-0.2 rounded-full uppercase tracking-wider font-bold ${
          provider === 'iframe' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'
        }`}>
          Free
        </span>
      </button>

      <button
        type="button"
        id="provider-mapbox-btn"
        onClick={() => onProviderChange('mapbox')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
          provider === 'mapbox'
            ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
        }`}
        title="Mapbox 3D vector map with night lighting & building extrusions"
      >
        <Sparkles className={`h-3.5 w-3.5 ${provider === 'mapbox' ? 'text-white' : 'text-sky-400'}`} />
        <span>Mapbox 3D</span>
      </button>

      <button
        type="button"
        id="provider-google-btn"
        onClick={() => onProviderChange('google')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
          provider === 'google'
            ? 'bg-geo-blue text-white shadow-md shadow-geo-blue/20'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
        }`}
        title="Google Maps JavaScript API"
      >
        <Layers className={`h-3.5 w-3.5 ${provider === 'google' ? 'text-white' : 'text-geo-blue'}`} />
        <span>Google Maps</span>
      </button>
    </div>
  );
};

export default MapProviderSelector;

