
# GEO-MAN 

## GEOLOCATION FOLLOWER

**URL**: https://preview--geo-follower.lovable.app/

A real-time location tracking application that allows you to create tracking links, monitor device locations, and view them on a map.

## Development Setup

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone https://github.com/Emmanuelkhisa/geo-follower

# Step 2: Navigate to the project directory.
cd geo-follower

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Important Setup for Full Functionality

For the application to work properly, you need to:

1. **Get a Mapbox Token**:
   - Create a free account at [mapbox.com](https://mapbox.com)
   - Get your public access token from the dashboard
   - Enter this token when prompted by the application

2. **Run the WebSocket Server** (for real-time location updates):
   - A simple WebSocket server is included in `src/server/server.js`
   - Install the WebSocket dependency: `npm install ws`
   - Run the server: `node src/server/server.js`
   - The server will listen on port 8081

**Note**: In the preview environment, the application runs in simulation mode and doesn't require a real WebSocket server.

## How To Use
 - Create a tracking link
 - Share this link with a target device
 - View on map or record all the data using node terminal (instructions in web)
 - Avoid cross-origin location tracing by ensuring the target device has access to the application.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Mapbox GL JS
- WebSockets

## License:
This project is licensed under the MIT License. Feel free to use, modify, and distribute as per the terms of the license.
