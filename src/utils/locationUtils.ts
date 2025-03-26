
export interface LocationData {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface SavedTracker {
  id: string;
  name: string;
  lastSeen?: number;
  notes?: string;
}

export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });
  });
};

export const formatLocation = (position: GeolocationPosition, trackerId: string): LocationData => {
  return {
    id: trackerId,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: position.timestamp
  };
};

export const getFormattedDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  
  // Format the date as "May 10, 2023 at 14:30:45"
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
};

export const generateTrackerId = (): string => {
  // Generate a random ID consisting of letters and numbers
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  
  // First part: 4 characters
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  id += '-';
  
  // Second part: 6 characters
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return id;
};

// Device management functions
export const getSavedTrackers = (): SavedTracker[] => {
  try {
    const saved = localStorage.getItem('savedTrackers');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading saved trackers:', error);
    return [];
  }
};

export const saveTracker = (tracker: SavedTracker): void => {
  try {
    const trackers = getSavedTrackers();
    const existingIndex = trackers.findIndex(t => t.id === tracker.id);
    
    if (existingIndex >= 0) {
      trackers[existingIndex] = tracker;
    } else {
      trackers.push(tracker);
    }
    
    localStorage.setItem('savedTrackers', JSON.stringify(trackers));
  } catch (error) {
    console.error('Error saving tracker:', error);
  }
};

export const deleteTracker = (trackerId: string): void => {
  try {
    const trackers = getSavedTrackers();
    const filteredTrackers = trackers.filter(t => t.id !== trackerId);
    localStorage.setItem('savedTrackers', JSON.stringify(filteredTrackers));
  } catch (error) {
    console.error('Error deleting tracker:', error);
  }
};

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/locationWorker.js');
      console.log('ServiceWorker registration successful with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
      return null;
    }
  }
  console.warn('ServiceWorker is not supported in this browser');
  return null;
};

export const startBackgroundTracking = (trackerId: string, interval = 60000): void => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'START_TRACKING',
      data: { trackerId, interval }
    });
  } else {
    console.warn('ServiceWorker is not active yet, cannot start background tracking');
  }
};

export const stopBackgroundTracking = (): void => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'STOP_TRACKING'
    });
  }
};
