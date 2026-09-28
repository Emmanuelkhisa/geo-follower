import { useEffect, useRef, useState } from 'react';
import { LocationData, fetchAddress, getCardinalDirection, getFormattedDate } from '@/utils/locationUtils';
import { Button } from '@/components/ui/button';
import { 
  Navigation, 
  Compass, 
  Gauge, 
  Mountain, 
  ExternalLink, 
  MapPin, 
  Maximize2, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Crosshair,
  Copy,
  Check
} from 'lucide-react';

interface IframeMapProps {
  locationData: LocationData | null;
  followMode?: boolean;
  onToggleFollowMode?: () => void;
}

const IframeMap = ({ locationData, followMode = true, onToggleFollowMode }: IframeMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [address, setAddress] = useState<string>('Resolving location...');
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [isTelemetryExpanded, setIsTelemetryExpanded] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const historyRef = useRef<Array<[number, number]>>([]);

  const lat = locationData ? locationData.latitude : -1.2921; // Nairobi default
  const lng = locationData ? locationData.longitude : 36.8219;
  const accuracy = locationData ? locationData.accuracy : 15;
  const speedKmh = locationData?.speed ? (locationData.speed * 3.6).toFixed(1) : '0.0';
  const altitudeM = locationData?.altitude ? Math.round(locationData.altitude) : null;
  const headingStr = getCardinalDirection(locationData?.heading);

  // Fetch address whenever location changes
  useEffect(() => {
    if (!locationData) return;
    let isMounted = true;
    fetchAddress(locationData.latitude, locationData.longitude).then((res) => {
      if (isMounted) setAddress(res);
    });
    
    // Add to route history
    const point: [number, number] = [locationData.latitude, locationData.longitude];
    const lastPoint = historyRef.current[historyRef.current.length - 1];
    if (!lastPoint || lastPoint[0] !== point[0] || lastPoint[1] !== point[1]) {
      historyRef.current.push(point);
      setHistoryCount(historyRef.current.length);
    }

    return () => { isMounted = false; };
  }, [locationData]);

  // Send postMessage to Leaflet inside srcDoc iframe when location updates
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow && locationData) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_LOCATION',
        lat: locationData.latitude,
        lng: locationData.longitude,
        accuracy: locationData.accuracy,
        speed: locationData.speed || 0,
        altitude: locationData.altitude || null,
        followMode,
        history: historyRef.current,
        address
      }, '*');
    }
  }, [locationData, followMode, address]);

  const handleCopyCoordinates = () => {
    if (locationData) {
      navigator.clipboard.writeText(`${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleRecenter = () => {
    if (iframeRef.current?.contentWindow && locationData) {
      iframeRef.current.contentWindow.postMessage({
        type: 'RECENTER',
        lat: locationData.latitude,
        lng: locationData.longitude
      }, '*');
    }
  };

  // Construct self-contained Leaflet map with interactive multi-layer switcher and tap-to-measure
  const srcDocHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; }
    html, body, #map {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      background: #090d16;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      touch-action: pan-x pan-y;
    }
    
    /* Custom Marker Styles */
    .custom-device-marker {
      position: relative;
      width: 32px;
      height: 32px;
    }
    .pulse-ring {
      position: absolute;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid #ef4444;
      animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
      box-shadow: 0 0 15px rgba(239, 68, 68, 0.6);
    }
    .inner-dot {
      position: absolute;
      top: 6px;
      left: 6px;
      width: 20px;
      height: 20px;
      background: radial-gradient(circle, #ef4444 0%, #b91c1c 100%);
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 12px rgba(239, 68, 68, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    @keyframes ping {
      75%, 100% {
        transform: scale(2.5);
        opacity: 0;
      }
    }

    .click-pin-marker {
      width: 24px;
      height: 24px;
      background: #38bdf8;
      border: 2px solid #ffffff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.8);
    }

    /* Popups */
    .leaflet-popup-content-wrapper {
      background: #0f172a !important;
      color: #f8fafc !important;
      border-radius: 14px !important;
      border: 1px solid rgba(255, 255, 255, 0.18) !important;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5) !important;
      padding: 4px !important;
    }
    .leaflet-popup-tip {
      background: #0f172a !important;
      border: 1px solid rgba(255, 255, 255, 0.18) !important;
    }
    .leaflet-popup-content {
      margin: 10px 12px !important;
      line-height: 1.4 !important;
    }

    /* Layer Controls Styling */
    .leaflet-control-layers {
      background: #0f172a !important;
      color: #e2e8f0 !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      border-radius: 12px !important;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4) !important;
      font-size: 12px !important;
      padding: 6px 10px !important;
    }
    .leaflet-control-layers label {
      cursor: pointer;
      margin: 4px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .leaflet-control-zoom a {
      background: #0f172a !important;
      color: #38bdf8 !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
    }
    .leaflet-control-zoom a:hover {
      background: #1e293b !important;
      color: #7dd3fc !important;
    }

    /* Dark tile style filter */
    .dark-tiles .leaflet-tile-container img {
      filter: brightness(0.7) invert(1) contrast(2.5) hue-rotate(200deg) saturate(0.35) brightness(0.75);
    }
  </style>
</head>
<body>
  <div id="map" class="dark-tiles"></div>
  <script>
    var currentDeviceLat = ${lat};
    var currentDeviceLng = ${lng};

    var map = L.map('map', { 
      zoomControl: true, 
      tap: true,
      touchZoom: true,
      scrollWheelZoom: true
    }).setView([currentDeviceLat, currentDeviceLng], 15);

    // Layer options
    var darkLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    });

    var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    });

    var satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    var topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
      attribution: 'Map data: &copy; OpenStreetMap, SRTM | Map style: &copy; OpenTopoMap'
    });

    darkLayer.addTo(map);

    var baseMaps = {
      "🌙 Dark Navigation": darkLayer,
      "🛰️ Satellite Imagery": satelliteLayer,
      "🗺️ Standard Streets": osmLayer,
      "🏔️ Topo / Outdoors": topoLayer
    };

    L.control.layers(baseMaps, null, { position: 'topright', collapsed: true }).addTo(map);

    map.on('baselayerchange', function(e) {
      var mapEl = document.getElementById('map');
      if (e.name.indexOf('Dark') !== -1) {
        mapEl.classList.add('dark-tiles');
      } else {
        mapEl.classList.remove('dark-tiles');
      }
    });

    // Custom pulse marker for tracked device
    var deviceIcon = L.divIcon({
      className: 'custom-device-marker',
      html: '<div class="pulse-ring"></div><div class="inner-dot"></div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    var marker = L.marker([currentDeviceLat, currentDeviceLng], { icon: deviceIcon, zIndexOffset: 1000 }).addTo(map);
    var circle = L.circle([currentDeviceLat, currentDeviceLng], {
      radius: ${accuracy},
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 0.12,
      weight: 1.5
    }).addTo(map);

    var polyline = L.polyline([], {
      color: '#38bdf8',
      weight: 4,
      opacity: 0.85,
      dashArray: '6, 8'
    }).addTo(map);

    function updateDevicePopup(lat, lng, acc, addr) {
      marker.bindPopup(
        "<div style='font-size:13px;'>" +
        "<div style='font-weight:700; color:#ef4444; margin-bottom:4px;'>📍 Tracked Device</div>" +
        (addr ? "<div style='color:#cbd5e1; font-size:12px; margin-bottom:6px;'>" + addr + "</div>" : "") +
        "<div><b>Lat:</b> " + lat.toFixed(6) + "°</div>" +
        "<div><b>Lng:</b> " + lng.toFixed(6) + "°</div>" +
        "<div><b>Accuracy:</b> ±" + acc.toFixed(1) + "m</div>" +
        "</div>"
      );
    }
    updateDevicePopup(currentDeviceLat, currentDeviceLng, ${accuracy}, "${address}");

    // Click / Tap anywhere on map to inspect coordinates & measure distance!
    var clickMarker = null;
    function calculateDistance(lat1, lon1, lat2, lon2) {
      var R = 6371e3; // metres
      var φ1 = lat1 * Math.PI/180;
      var φ2 = lat2 * Math.PI/180;
      var Δφ = (lat2-lat1) * Math.PI/180;
      var Δλ = (lon2-lon1) * Math.PI/180;
      var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }

    map.on('click', function(e) {
      var clickedLat = e.latlng.lat;
      var clickedLng = e.latlng.lng;
      var distMeters = calculateDistance(currentDeviceLat, currentDeviceLng, clickedLat, clickedLng);
      var distStr = distMeters > 1000 ? (distMeters / 1000).toFixed(2) + ' km' : Math.round(distMeters) + ' m';

      if (!clickMarker) {
        var clickIcon = L.divIcon({
          className: 'click-pin-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 20]
        });
        clickMarker = L.marker([clickedLat, clickedLng], { icon: clickIcon }).addTo(map);
      } else {
        clickMarker.setLatLng([clickedLat, clickedLng]);
      }

      clickMarker.bindPopup(
        "<div style='font-size:13px;'>" +
        "<div style='font-weight:700; color:#38bdf8; margin-bottom:4px;'>📌 Selected Point</div>" +
        "<div><b>Lat:</b> " + clickedLat.toFixed(6) + "°</div>" +
        "<div><b>Lng:</b> " + clickedLng.toFixed(6) + "°</div>" +
        "<div style='margin-top:4px; padding-top:4px; border-top:1px solid rgba(255,255,255,0.1); color:#34d399; font-weight:600;'>" +
        "📏 <b>Distance:</b> " + distStr + " from device" +
        "</div>" +
        "</div>"
      ).openPopup();
    });

    // Handle postMessages from parent React application
    window.addEventListener('message', function(event) {
      var data = event.data;
      if (!data) return;

      if (data.type === 'UPDATE_LOCATION') {
        currentDeviceLat = data.lat;
        currentDeviceLng = data.lng;
        var newLatLng = [data.lat, data.lng];
        marker.setLatLng(newLatLng);
        circle.setLatLng(newLatLng);
        circle.setRadius(data.accuracy);
        
        if (data.history && data.history.length > 0) {
          polyline.setLatLngs(data.history);
        }

        if (data.followMode) {
          map.panTo(newLatLng, { animate: true, duration: 1 });
        }

        updateDevicePopup(data.lat, data.lng, data.accuracy, data.address);
      } else if (data.type === 'RECENTER') {
        map.setView([data.lat, data.lng], 16, { animate: true });
      }
    });
  </script>
</body>
</html>
  `;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950"
    >
      <iframe
        ref={iframeRef}
        title="Live Interactive Map"
        srcDoc={srcDocHtml}
        className="w-full h-full border-0 absolute inset-0 z-0"
        sandbox="allow-scripts allow-same-origin"
      />

      {/* Floating Rich Telemetry Overlay Card (Non-blocking with pointer-events-none parent) */}
      <div className="absolute top-4 left-4 z-10 max-w-xs md:max-w-sm pointer-events-none">
        <div className="bg-slate-900/95 backdrop-blur-xl p-3 rounded-2xl border border-slate-700/70 shadow-2xl text-white space-y-2 pointer-events-auto transition-all duration-300">
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-xs text-slate-200 uppercase tracking-wider">Live OpenStreetMap</span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                {historyCount} Pings
              </span>
              <button
                type="button"
                onClick={() => setIsTelemetryExpanded(!isTelemetryExpanded)}
                className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
                title={isTelemetryExpanded ? "Collapse HUD" : "Expand HUD"}
              >
                {isTelemetryExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-0.5">
            <MapPin className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 font-medium leading-snug line-clamp-2" title={address}>
              {address}
            </div>
          </div>

          {isTelemetryExpanded && (
            <>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs text-slate-300">
                <div className="flex items-center gap-1.5 bg-slate-800/80 p-2 rounded-xl border border-slate-700/50">
                  <Gauge className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-sans">Speed</div>
                    <div className="font-bold text-white">{speedKmh} <span className="text-[10px] font-normal">km/h</span></div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-800/80 p-2 rounded-xl border border-slate-700/50">
                  <Mountain className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-sans">Altitude</div>
                    <div className="font-bold text-white">{altitudeM !== null ? `${altitudeM} m` : 'N/A'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-800/80 p-2 rounded-xl border border-slate-700/50">
                  <Compass className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-sans">Heading</div>
                    <div className="font-bold text-white truncate">{headingStr}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-800/80 p-2 rounded-xl border border-slate-700/50">
                  <div className="h-3.5 w-3.5 rounded-full border border-rose-400 flex items-center justify-center text-[9px] text-rose-400 font-bold shrink-0">±</div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-sans">Accuracy</div>
                    <div className="font-bold text-white">±{accuracy.toFixed(1)} <span className="text-[10px] font-normal">m</span></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCopyCoordinates}
                  className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
                  title="Copy Lat, Lng"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-slate-400" />}
                  <span>{lat.toFixed(4)}°, {lng.toFixed(4)}°</span>
                </button>

                <a
                  href={`https://www.google.com/maps?q=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-geo-blue hover:underline flex items-center gap-1 font-sans font-medium"
                >
                  Open External <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating Action Controls (Top Right Quick Actions) */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 pointer-events-auto">
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={handleRecenter}
          title="Recenter on Tracked Device"
          className="h-9 w-9 bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700 shadow-xl rounded-xl"
        >
          <Crosshair className="h-4 w-4 text-emerald-400" />
        </Button>

        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={handleToggleFullscreen}
          title="Toggle Fullscreen"
          className="h-9 w-9 bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700 shadow-xl rounded-xl"
        >
          <Maximize2 className="h-4 w-4 text-slate-300" />
        </Button>
      </div>

      {/* Tap Hint Badge on Map */}
      <div className="absolute bottom-16 left-4 z-10 pointer-events-none hidden sm:block">
        <span className="text-[11px] bg-slate-900/80 backdrop-blur-md text-slate-300 px-3 py-1 rounded-full border border-slate-700/60 shadow-lg">
          💡 Tap anywhere on map to measure distance & inspect coordinates
        </span>
      </div>

      {/* Bottom Right Follow Mode Toggle */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-auto">
        {onToggleFollowMode && locationData && (
          <Button 
            onClick={onToggleFollowMode} 
            variant={followMode ? "default" : "outline"}
            size="sm"
            className={followMode ? "bg-geo-blue hover:bg-geo-blue/90 text-sm px-4 py-2 shadow-xl rounded-xl font-medium" : "bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700 text-sm px-4 py-2 shadow-xl rounded-xl font-medium"}
          >
            <Navigation className={followMode ? "animate-pulse mr-2" : "mr-2"} size={16} />
            {followMode ? "Following Device" : "Follow Device"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default IframeMap;

