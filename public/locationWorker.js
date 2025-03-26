
// Location Tracking Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('Location Service Worker installed');
});

self.addEventListener('activate', (event) => {
  console.log('Location Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Store tracking data
let activeTrackers = new Map(); // Map of trackerId -> interval ID
let wsConnection = null;

// Handle messages from the main app
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'START_TRACKING':
      startTracking(data.trackerId, data.interval || 60000);
      break;
    case 'STOP_TRACKING':
      stopTracking(data.trackerId);
      break;
    default:
      console.log('Unknown message type:', type);
  }
});

function startTracking(id, interval) {
  // If already tracking this ID, clear the previous interval
  if (activeTrackers.has(id)) {
    clearInterval(activeTrackers.get(id));
  }
  
  console.log(`Starting background tracking for ID: ${id}`);
  
  // Initialize WebSocket connection if not already connected
  if (!wsConnection && self.WebSocket) {
    connectWebSocket();
  }
  
  // Start tracking at specified interval
  getCurrentPosition()
    .then(position => sendLocationUpdate(position, id))
    .catch(error => console.error('Initial position error:', error));
  
  const intervalId = setInterval(() => {
    getCurrentPosition()
      .then(position => sendLocationUpdate(position, id))
      .catch(error => console.error('Position error:', error));
  }, interval);
  
  // Store the interval ID for this tracker
  activeTrackers.set(id, intervalId);
  
  // Notify clients that tracking has started
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'TRACKING_STARTED',
        trackerId: id
      });
    });
  });
}

function stopTracking(trackerId) {
  if (!trackerId) {
    // Stop all trackers if no specific trackerId provided
    console.log('Stopping all background tracking');
    activeTrackers.forEach((intervalId, id) => {
      clearInterval(intervalId);
    });
    activeTrackers.clear();
    
    if (wsConnection) {
      wsConnection.close();
      wsConnection = null;
    }
  } else if (activeTrackers.has(trackerId)) {
    // Stop only the specified tracker
    console.log(`Stopping background tracking for ID: ${trackerId}`);
    clearInterval(activeTrackers.get(trackerId));
    activeTrackers.delete(trackerId);
  }
  
  // If no more active trackers, close WebSocket
  if (activeTrackers.size === 0 && wsConnection) {
    wsConnection.close();
    wsConnection = null;
  }
  
  // Notify clients that tracking has stopped
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'TRACKING_STOPPED',
        trackerId: trackerId
      });
    });
  });
}

function getCurrentPosition() {
  // Since service workers don't have direct access to geolocation,
  // We'll use a simulated position with small random changes
  // In a real app, we'd use a different strategy like periodic sync
  return new Promise((resolve) => {
    // Get last position from localStorage if possible (simulated)
    const lastPosition = {
      coords: {
        latitude: Math.random() * 180 - 90, // Random lat between -90 and 90
        longitude: Math.random() * 360 - 180, // Random lng between -180 and 180
        accuracy: 10 + Math.random() * 20
      },
      timestamp: Date.now()
    };
    
    resolve(lastPosition);
  });
}

function sendLocationUpdate(position, trackerId) {
  if (!trackerId) return;
  
  const locationData = {
    id: trackerId,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: position.timestamp
  };
  
  console.log('Location update in worker:', locationData);
  
  // Try to send via WebSocket if available
  if (wsConnection && wsConnection.readyState === 1) {
    wsConnection.send(JSON.stringify({
      type: 'location',
      trackerId: trackerId,
      data: locationData
    }));
  }
  
  // Also notify any active clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'LOCATION_UPDATE',
        data: locationData
      });
    });
  });
  
  // Store the latest location in IndexedDB or another persistent storage
  // This is a simulation, in a real app you would use IndexedDB
  try {
    self.lastLocations = self.lastLocations || {};
    self.lastLocations[trackerId] = locationData;
  } catch (error) {
    console.error('Error storing location:', error);
  }
}

function connectWebSocket() {
  // Determine WebSocket URL based on environment
  const WS_URL = 'ws://localhost:8081';
  
  try {
    wsConnection = new WebSocket(WS_URL);
    
    wsConnection.onopen = () => {
      console.log('Worker WebSocket connection established');
      
      // Register all active trackers with server
      activeTrackers.forEach((_, trackerId) => {
        wsConnection.send(JSON.stringify({
          type: 'register',
          trackerId: trackerId
        }));
      });
    };
    
    wsConnection.onclose = () => {
      console.log('Worker WebSocket connection closed');
      setTimeout(() => {
        // Only reconnect if we have active trackers
        if (activeTrackers.size > 0) {
          connectWebSocket();
        }
      }, 3000); // Try to reconnect
    };
    
    wsConnection.onerror = (error) => {
      console.error('Worker WebSocket error:', error);
    };
  } catch (error) {
    console.error('Error connecting to WebSocket from worker:', error);
  }
}
