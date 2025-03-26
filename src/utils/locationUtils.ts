
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
  isTracking?: boolean;
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
      // Update existing tracker but preserve isTracking state
      const isCurrentlyTracking = trackers[existingIndex].isTracking;
      trackers[existingIndex] = {
        ...tracker,
        isTracking: isCurrentlyTracking || tracker.isTracking
      };
    } else {
      trackers.push(tracker);
    }
    
    localStorage.setItem('savedTrackers', JSON.stringify(trackers));
  } catch (error) {
    console.error('Error saving tracker:', error);
  }
};

export const updateTrackerStatus = (trackerId: string, isTracking: boolean): void => {
  try {
    const trackers = getSavedTrackers();
    const existingIndex = trackers.findIndex(t => t.id === trackerId);
    
    if (existingIndex >= 0) {
      trackers[existingIndex].isTracking = isTracking;
      localStorage.setItem('savedTrackers', JSON.stringify(trackers));
    }
  } catch (error) {
    console.error('Error updating tracker status:', error);
  }
};

export const updateTrackerLastSeen = (trackerId: string, timestamp: number): void => {
  try {
    const trackers = getSavedTrackers();
    const existingIndex = trackers.findIndex(t => t.id === trackerId);
    
    if (existingIndex >= 0) {
      trackers[existingIndex].lastSeen = timestamp;
      localStorage.setItem('savedTrackers', JSON.stringify(trackers));
    }
  } catch (error) {
    console.error('Error updating tracker last seen:', error);
  }
};

export const deleteTracker = (trackerId: string): void => {
  try {
    const trackers = getSavedTrackers();
    const filteredTrackers = trackers.filter(t => t.id !== trackerId);
    localStorage.setItem('savedTrackers', JSON.stringify(filteredTrackers));
    
    // Also stop tracking for this tracker if it's active
    stopBackgroundTracking(trackerId);
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

export const getActiveTrackers = (): string[] => {
  try {
    const trackers = getSavedTrackers();
    return trackers
      .filter(tracker => tracker.isTracking)
      .map(tracker => tracker.id);
  } catch (error) {
    console.error('Error getting active trackers:', error);
    return [];
  }
};

export const startBackgroundTracking = (trackerId: string, interval = 60000): void => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'START_TRACKING',
      data: { trackerId, interval }
    });
    
    // Update the tracker's status in localStorage
    updateTrackerStatus(trackerId, true);
  } else {
    console.warn('ServiceWorker is not active yet, cannot start background tracking');
    // Try to register and then start tracking
    registerServiceWorker().then(() => {
      setTimeout(() => {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'START_TRACKING',
            data: { trackerId, interval }
          });
          updateTrackerStatus(trackerId, true);
        }
      }, 1000);
    });
  }
};

export const stopBackgroundTracking = (trackerId?: string): void => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'STOP_TRACKING',
      data: { trackerId }
    });
    
    // If trackerId is provided, only update that tracker
    if (trackerId) {
      updateTrackerStatus(trackerId, false);
    } else {
      // Update all trackers to not tracking
      const trackers = getSavedTrackers();
      trackers.forEach(tracker => {
        tracker.isTracking = false;
      });
      localStorage.setItem('savedTrackers', JSON.stringify(trackers));
    }
  }
};

// Function to restore active trackers after page reload
export const restoreActiveTrackers = (): void => {
  const activeTrackers = getActiveTrackers();
  
  if (activeTrackers.length > 0 && 'serviceWorker' in navigator) {
    console.log('Restoring active trackers:', activeTrackers);
    
    // Register service worker first if needed
    registerServiceWorker().then(() => {
      // Start tracking for each active tracker
      activeTrackers.forEach(trackerId => {
        setTimeout(() => {
          startBackgroundTracking(trackerId);
        }, 1000);
      });
    });
  }
};
