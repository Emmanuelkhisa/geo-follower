
import { LocationData } from './locationUtils';

// For development and preview, we'll simulate the WebSocket service
// since a real WebSocket server would need to be running on your own server
const IS_WEBSOCKET_SIMULATION = true;

// For production, this would be your actual WebSocket server URL
const WS_URL = window.location.hostname === 'localhost' 
  ? 'ws://localhost:8081' 
  : `wss://${window.location.hostname}:8081`;

export class WebSocketService {
  private socket: WebSocket | null = null;
  private trackerId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; // 3 seconds
  private simulatedConnected = false;
  
  constructor(trackerId: string) {
    this.trackerId = trackerId;
  }
  
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (IS_WEBSOCKET_SIMULATION) {
        console.log('SIMULATION MODE: WebSocket connection simulated');
        this.simulatedConnected = true;
        setTimeout(resolve, 500); // Simulate connection delay
        return;
      }

      try {
        this.socket = new WebSocket(`${WS_URL}`);
        
        this.socket.onopen = () => {
          console.log('WebSocket connection established');
          this.reconnectAttempts = 0;
          
          // Register this trackerId with the server
          this.sendMessage({
            type: 'register',
            trackerId: this.trackerId
          });
          
          resolve();
        };
        
        this.socket.onclose = (event) => {
          console.log('WebSocket connection closed:', event);
          this.attemptReconnect();
        };
        
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        reject(error);
      }
    });
  }
  
  sendLocation(locationData: LocationData): void {
    if (IS_WEBSOCKET_SIMULATION) {
      console.log('SIMULATION MODE: Location sent to server', {
        type: 'location',
        trackerId: this.trackerId,
        data: locationData
      });
      return;
    }

    this.sendMessage({
      type: 'location',
      trackerId: this.trackerId,
      data: locationData
    });
  }
  
  private sendMessage(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }
  
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection attempt failed:', error);
        });
      }, this.reconnectInterval);
    } else {
      console.error('Maximum reconnection attempts reached');
    }
  }
  
  disconnect(): void {
    if (IS_WEBSOCKET_SIMULATION) {
      console.log('SIMULATION MODE: WebSocket disconnected');
      this.simulatedConnected = false;
      return;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export class MapWebSocketService {
  private socket: WebSocket | null = null;
  private trackerId: string;
  private onLocationUpdate: (data: LocationData) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; // 3 seconds
  private simulationInterval: number | null = null;
  
  constructor(trackerId: string, onLocationUpdate: (data: LocationData) => void) {
    this.trackerId = trackerId;
    this.onLocationUpdate = onLocationUpdate;
  }
  
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (IS_WEBSOCKET_SIMULATION) {
        console.log('SIMULATION MODE: Map WebSocket connection simulated');
        
        // In simulation mode, we'll generate random location updates
        this.simulationInterval = window.setInterval(() => {
          // Start with fixed point and add some randomness
          const baseLatitude = 0.0;
          const baseLongitude = 0.0;
          
          const randomLat = baseLatitude + (Math.random() * 0.01) - 0.005;
          const randomLng = baseLongitude + (Math.random() * 0.01) - 0.005;
          
          this.onLocationUpdate({
            latitude: randomLat,
            longitude: randomLng,
            accuracy: 10 + Math.random() * 20,
            timestamp: Date.now(),
            trackerId: this.trackerId
          });
        }, 10000); // Simulate update every 10 seconds
        
        setTimeout(resolve, 500); // Simulate connection delay
        return;
      }

      try {
        this.socket = new WebSocket(`${WS_URL}`);
        
        this.socket.onopen = () => {
          console.log('WebSocket connection established for map');
          this.reconnectAttempts = 0;
          
          // Subscribe to location updates for this trackerId
          this.sendMessage({
            type: 'subscribe',
            trackerId: this.trackerId
          });
          
          resolve();
        };
        
        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            if (message.type === 'location' && message.trackerId === this.trackerId) {
              this.onLocationUpdate(message.data);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        this.socket.onclose = (event) => {
          console.log('Map WebSocket connection closed:', event);
          this.attemptReconnect();
        };
        
        this.socket.onerror = (error) => {
          console.error('Map WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        console.error('Error connecting to Map WebSocket:', error);
        reject(error);
      }
    });
  }
  
  private sendMessage(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }
  
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      console.log(`Attempting to reconnect map (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Map reconnection attempt failed:', error);
        });
      }, this.reconnectInterval);
    } else {
      console.error('Maximum map reconnection attempts reached');
    }
  }
  
  disconnect(): void {
    if (IS_WEBSOCKET_SIMULATION && this.simulationInterval !== null) {
      window.clearInterval(this.simulationInterval);
      this.simulationInterval = null;
      console.log('SIMULATION MODE: Map WebSocket disconnected');
      return;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
