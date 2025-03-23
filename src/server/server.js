
// This is a simple WebSocket server that can be run with Node.js
// To use: 
// 1. Save this file as server.js
// 2. Run: npm install ws
// 3. Start server with: node server.js

const WebSocket = require('ws');

const PORT = 8081;
const wsServer = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server is running on port ${PORT}`);

// Store client connections by trackerId
const clients = new Map();
// Store location data by trackerId
const locations = new Map();

wsServer.on('connection', (socket) => {
  console.log('Client connected');
  
  // Handle messages from clients
  socket.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      
      switch (parsedMessage.type) {
        case 'register':
          handleRegister(socket, parsedMessage.trackerId);
          break;
          
        case 'subscribe':
          handleSubscribe(socket, parsedMessage.trackerId);
          break;
          
        case 'location':
          handleLocation(parsedMessage.trackerId, parsedMessage.data);
          break;
          
        default:
          console.log('Unknown message type:', parsedMessage.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  // Handle client disconnection
  socket.on('close', () => {
    console.log('Client disconnected');
    
    // Remove client from trackers
    for (const [trackerId, clientsForTracker] of clients.entries()) {
      const index = clientsForTracker.indexOf(socket);
      if (index !== -1) {
        clientsForTracker.splice(index, 1);
        
        // If no clients are left for this tracker, remove the tracker
        if (clientsForTracker.length === 0) {
          clients.delete(trackerId);
        }
        
        console.log(`Client removed from tracker: ${trackerId}`);
      }
    }
  });
});

function handleRegister(socket, trackerId) {
  console.log(`Registering client for tracker: ${trackerId}`);
  
  if (!clients.has(trackerId)) {
    clients.set(trackerId, []);
  }
  
  clients.get(trackerId).push(socket);
}

function handleSubscribe(socket, trackerId) {
  console.log(`Subscribing client to tracker: ${trackerId}`);
  
  if (!clients.has(trackerId)) {
    clients.set(trackerId, []);
  }
  
  clients.get(trackerId).push(socket);
  
  // Send the latest location if available
  if (locations.has(trackerId)) {
    const locationData = locations.get(trackerId);
    
    socket.send(JSON.stringify({
      type: 'location',
      trackerId,
      data: locationData
    }));
  }
}

function handleLocation(trackerId, locationData) {
  console.log(`Received location for tracker: ${trackerId}`, locationData);
  
  // Store the location data
  locations.set(trackerId, locationData);
  
  // Broadcast to all clients subscribed to this tracker
  if (clients.has(trackerId)) {
    const message = JSON.stringify({
      type: 'location',
      trackerId,
      data: locationData
    });
    
    for (const client of clients.get(trackerId)) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }
  
  // Log the location info to the console for terminal viewing
  console.log('\n==== LOCATION UPDATE ====');
  console.log(`Tracker ID: ${trackerId}`);
  console.log(`Latitude: ${locationData.latitude}`);
  console.log(`Longitude: ${locationData.longitude}`);
  console.log(`Accuracy: ${locationData.accuracy} meters`);
  console.log(`Timestamp: ${new Date(locationData.timestamp).toLocaleString()}`);
  console.log('========================\n');
}

// Handle server shutdown gracefully
process.on('SIGINT', () => {
  wsServer.close(() => {
    console.log('WebSocket server shut down');
    process.exit(0);
  });
});
