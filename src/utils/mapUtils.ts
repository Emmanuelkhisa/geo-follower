
// Map utility functions

// Create a utility function to create map UI elements
export const createMapLegend = () => {
  const legend = document.createElement('div');
  legend.className = 'absolute top-4 left-4 z-10 bg-black/70 p-3 rounded-md shadow-md text-white text-sm border border-white/20';
  
  const items = [
    { color: 'bg-blue-600', shadow: 'shadow-[0_0_5px_rgba(0,0,255,0.7)]', label: 'Current Device' },
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
