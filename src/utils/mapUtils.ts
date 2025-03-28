
// Calculate distance between two points in meters
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Calculate estimated travel time based on walking speed (4 km/h)
export const calculateTravelTime = (distanceInMeters: number): string => {
  const walkingSpeedMetersPerMinute = 4000 / 60;
  const minutes = Math.round(distanceInMeters / walkingSpeedMetersPerMinute);
  
  if (minutes < 1) {
    return "Less than a minute";
  } else if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours === 1 ? '' : 's'}${remainingMinutes > 0 ? ` ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}` : ''}`;
  }
};

// Create a utility function to create map UI elements
export const createMapLegend = () => {
  const legend = document.createElement('div');
  legend.className = 'absolute top-4 left-4 z-10 bg-black/70 p-3 rounded-md shadow-md text-white text-sm border border-white/20';
  
  const items = [
    { color: 'bg-blue-600', shadow: 'shadow-[0_0_5px_rgba(0,0,255,0.7)]', label: 'Current Device' },
    { color: 'bg-yellow-500', shadow: 'shadow-[0_0_5px_rgba(255,215,0,0.7)]', label: 'Path/Route' },
    { color: 'bg-red-600', shadow: 'shadow-[0_0_5px_rgba(255,0,0,0.7)]', label: 'Tracked Device' }
  ];
  
  items.forEach((item, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'flex items-center gap-1' + (index < items.length - 1 ? ' mb-1' : '');
    
    const dot = document.createElement('div');
    dot.className = `w-3 h-3 rounded-full ${item.color} ${item.shadow}`;
    
    const label = document.createElement('span');
    label.textContent = item.label;
    
    itemDiv.appendChild(dot);
    itemDiv.appendChild(label);
    legend.appendChild(itemDiv);
  });
  
  return legend;
};

// Create a utility function to create map markers
export const createLocationMarker = (isTrackedDevice: boolean) => {
  const size = isTrackedDevice ? 10 : 8;
  const color = isTrackedDevice ? 'red' : 'blue';
  const glowColor = isTrackedDevice ? 'rgba(255,0,0,0.7)' : 'rgba(0,0,255,0.7)';
  
  const el = document.createElement('div');
  el.className = `relative w-${size} h-${size}`; 
  
  const innerDiv = document.createElement('div');
  innerDiv.className = `absolute w-${size} h-${size} bg-${color}-600 rounded-full flex items-center justify-center ${isTrackedDevice ? 'animate-pulse' : ''} shadow-[0_0_15px_${glowColor}]`;
  
  const dot = document.createElement('div');
  dot.className = `w-${size/2} h-${size/2} bg-white rounded-full`;
  
  if (isTrackedDevice) {
    // Add a pulse animation effect for tracked device
    const pulseRing = document.createElement('div');
    pulseRing.className = `absolute w-${size} h-${size} rounded-full border-4 border-red-600 animate-ping opacity-75`;
    el.appendChild(pulseRing);
  }
  
  innerDiv.appendChild(dot);
  el.appendChild(innerDiv);
  
  return el;
};
