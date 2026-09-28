
// Map utility functions

// Create a utility function to create map UI elements
export const createMapLegend = () => {
  const legend = document.createElement('div');
  legend.className = 'absolute top-4 left-4 z-10 bg-black/70 p-3 rounded-md shadow-md text-white text-sm border border-white/20';
  
  const items = [
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
  const size = 10;  // Make all markers the same size for consistency
  
  const el = document.createElement('div');
  el.className = 'relative flex items-center justify-center'; 
  el.style.width = `${size * 2}px`;
  el.style.height = `${size * 2}px`;
  
  // Add a pulse animation effect for tracked device
  if (isTrackedDevice) {
    const pulseRing = document.createElement('div');
    pulseRing.className = 'absolute rounded-full animate-ping';
    pulseRing.style.width = `${size * 2}px`;
    pulseRing.style.height = `${size * 2}px`;
    pulseRing.style.border = '4px solid #ef4444'; // red-500
    pulseRing.style.opacity = '0.75';
    el.appendChild(pulseRing);
  }
  
  const innerDiv = document.createElement('div');
  innerDiv.className = 'absolute rounded-full flex items-center justify-center animate-pulse';
  innerDiv.style.width = `${size * 2}px`;
  innerDiv.style.height = `${size * 2}px`;
  innerDiv.style.backgroundColor = '#dc2626'; // red-600
  innerDiv.style.boxShadow = '0 0 15px rgba(255, 0, 0, 0.7)';
  
  const dot = document.createElement('div');
  dot.className = 'rounded-full';
  dot.style.width = `${size}px`;
  dot.style.height = `${size}px`;
  dot.style.backgroundColor = '#ffffff'; // white
  
  innerDiv.appendChild(dot);
  el.appendChild(innerDiv);
  
  return el;
};
