
import { LocationData } from './locationUtils';

// For development, we'll use localhost
// In production, this would be your actual WebSocket server URL
const WS_URL = window.location.hostname === 'localhost' 
  ? 'ws://localhost:8081' 
  : `wss://${window.location.hostname}:8081`;

export class WebSocketService {
  private socket: WebSocket | null = null;
  private trackerId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; // 3 seconds
  
  constructor(trackerId: string) {
    this.trackerId = trackerId;
  }
  
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
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
  
  constructor(trackerId: string, onLocationUpdate: (data: LocationData) => void) {
    this.trackerId = trackerId;
    this.onLocationUpdate = onLocationUpdate;
  }
  
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
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
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
