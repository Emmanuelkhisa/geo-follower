
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MapPin, Map } from "lucide-react";

interface MapProviderSelectorProps {
  provider: 'mapbox' | 'google';
  onProviderChange: (provider: 'mapbox' | 'google') => void;
}

const MapProviderSelector = ({ provider, onProviderChange }: MapProviderSelectorProps) => {
  return (
    <div className="bg-black/70 p-3 rounded-md shadow-md border border-white/20">
      <div className="text-white text-sm font-medium mb-2">Map Provider</div>
      <RadioGroup
        value={provider}
        onValueChange={(value) => onProviderChange(value as 'mapbox' | 'google')}
        className="flex flex-col space-y-1"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="mapbox" id="mapbox" className="text-geo-blue" />
          <Label htmlFor="mapbox" className="text-white flex items-center cursor-pointer">
            <MapPin className="h-4 w-4 mr-1 text-geo-blue" />
            Mapbox
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="google" id="google" className="text-geo-blue" />
          <Label htmlFor="google" className="text-white flex items-center cursor-pointer">
            <Map className="h-4 w-4 mr-1 text-geo-blue" />
            Google Maps
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default MapProviderSelector;
